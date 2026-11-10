// Silvengard · Atlas vivo — inicializador para Windows
//
// Um único .exe que inicia o servidor local, abre o navegador, fica na bandeja
// do sistema e permite encerrar ou reiniciar a sessão. Tudo o que acontece é
// registrado em app\logs\atlas-launcher.log, para diagnóstico.
//
// Compilar com o csc.exe do .NET Framework:
//   csc /target:winexe /out:..\..\Silvengard-Atlas.exe /win32icon:atlas.ico ^
//       /r:System.Windows.Forms.dll /r:System.Drawing.dll Atlas.cs
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;

[assembly: AssemblyTitle("Silvengard · Atlas vivo")]
[assembly: AssemblyProduct("Silvengard Atlas")]
[assembly: AssemblyDescription("Inicia, abre e encerra o Atlas de Silvengard")]
[assembly: AssemblyCompany("Silvengard")]
[assembly: AssemblyVersion("1.1.0.0")]
[assembly: AssemblyFileVersion("1.1.0.0")]

static class Programa
{
    const string NomeMutex = "SilvengardAtlas.Running.v1";
    const int PortaPadrao = 8765;
    const int PortaMaxima = 8785;
    const string Titulo = "Silvengard · Atlas vivo";

    static string raiz;
    static string pastaApp;
    static string pastaLogs;
    static int porta;
    static Process servidor;
    static NotifyIcon bandeja;
    static ToolStripMenuItem itemAbrir;
    static ToolStripMenuItem itemIniciar;
    static ToolStripMenuItem itemParar;
    static ToolStripMenuItem itemReiniciar;
    static System.Windows.Forms.Timer relogio;

    [STAThread]
    static void Main(string[] args)
    {
        try
        {
            raiz = Path.GetDirectoryName(Application.ExecutablePath);
            pastaApp = Path.Combine(raiz, "app");
            pastaLogs = Path.Combine(pastaApp, "logs");
            Registrar("=== inicio; argumentos: " + string.Join(" ", args) + "; exe: " + Application.ExecutablePath);

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            if (!File.Exists(Path.Combine(pastaApp, "serve.py")))
            {
                Erro("Não encontrei a pasta \"app\" ao lado de Silvengard-Atlas.exe.\n\n"
                    + "Mantenha o executável na pasta principal do Atlas, junto de app, dados, "
                    + "documentos e acervo.\n\nDetalhes em app\\logs\\atlas-launcher.log.");
                return;
            }

            string acao = args.Length > 0 ? args[0].ToLowerInvariant() : "";
            if (acao == "--stop" || acao == "/stop" || acao == "--encerrar")
            {
                bool havia = EncerrarTudo(true);
                Informar(havia ? "Servidor do Atlas encerrado." : "O servidor do Atlas não estava aberto.");
                return;
            }
            if (acao == "--status" || acao == "/status")
            {
                Informar(StatusTexto());
                return;
            }
            if (acao == "--diagnostico" || acao == "/diagnostico")
            {
                Diagnostico();
                return;
            }
            bool semNavegador = acao == "--start" || acao == "/start" || acao == "--no-browser";

            // Fecha qualquer sessão anterior e começa uma nova, sempre.
            ReiniciarTudo();
            AssumirControle();

            CriarBandeja();
            string erro;
            if (!GarantirServidor(out erro))
            {
                Erro(erro);
                FecharBandeja();
                return;
            }
            if (!semNavegador) AbrirNavegador(porta);
            AtualizarEstado();
            AvisarInicio();
            // Laço de mensagens sem janela: o app vive só no ícone da bandeja.
            Application.Run(new ApplicationContext());
            Registrar("saindo do laço; encerrando servidor");
            EncerrarTudo(false);
            FecharBandeja();
            Registrar("=== fim ===");
        }
        catch (Exception e)
        {
            Registrar("FALHA NAO TRATADA: " + e);
            Erro("O Atlas encontrou um problema ao iniciar.\n\n" + e.Message
                + "\n\nO registro completo está em app\\logs\\atlas-launcher.log.");
        }
    }

    // ------------------------------------------------------- nova sessão

    static Mutex trava;

    /// <summary>Fecha servidor e inicializadores de sessões anteriores, para começar limpo.</summary>
    static void ReiniciarTudo()
    {
        Registrar("fechando sessões anteriores");
        int p, pid;
        LerArquivoPorta(out p, out pid);
        if (pid > 0) EncerrarPid(pid, false);
        EncerrarOutrasInstancias();          // o job object de cada uma leva o servidor junto
        ApagarArquivoPorta();
        int daPadrao = PidDaPorta(PortaPadrao);
        if (daPadrao > 0) EncerrarPid(daPadrao, true);
        for (int i = 0; i < 30 && !PortaLivre(PortaPadrao); i++) Thread.Sleep(100);
        Registrar("porta " + PortaPadrao + " livre: " + PortaLivre(PortaPadrao));
    }

    /// <summary>Serializa a inicialização; se outra cópia ainda estiver saindo, espera e segue.</summary>
    static void AssumirControle()
    {
        try
        {
            trava = new Mutex(false, NomeMutex);
            for (int i = 0; i < 3; i++)
            {
                try { if (trava.WaitOne(1500)) { Registrar("controle assumido"); return; } }
                catch (AbandonedMutexException) { Registrar("controle assumido (mutex abandonado)"); return; }
                EncerrarOutrasInstancias();
                Thread.Sleep(400);
            }
            Registrar("não consegui o mutex; seguindo mesmo assim");
        }
        catch (Exception e) { Registrar("mutex falhou: " + e.Message); }
    }

    static void EncerrarOutrasInstancias()
    {
        string nome = Path.GetFileNameWithoutExtension(Application.ExecutablePath);
        foreach (Process p in Process.GetProcessesByName(nome))
        {
            if (p.Id == Process.GetCurrentProcess().Id) continue;
            try { Registrar("encerrando instância anterior PID " + p.Id); p.Kill(); p.WaitForExit(3000); }
            catch (Exception e) { Registrar("não consegui encerrar PID " + p.Id + ": " + e.Message); }
        }
    }

    // ---------------------------------------------------------------- bandeja

    static void CriarBandeja()
    {
        bandeja = new NotifyIcon();
        try { bandeja.Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        catch { bandeja.Icon = SystemIcons.Application; }
        bandeja.Text = Titulo;
        bandeja.Visible = true;
        bandeja.DoubleClick += delegate { AbrirNavegador(porta); };

        ContextMenuStrip menu = new ContextMenuStrip();
        itemAbrir = Item(menu, "Abrir o Atlas no navegador", delegate { AbrirNavegador(porta); });
        itemAbrir.Font = new Font(itemAbrir.Font, FontStyle.Bold);
        itemIniciar = Item(menu, "Iniciar servidor", delegate { IniciarComAviso(); });
        itemReiniciar = Item(menu, "Reiniciar servidor", delegate { Reiniciar(); });
        itemParar = Item(menu, "Parar servidor", delegate { PararServidor(); AtualizarEstado(); });
        menu.Items.Add(new ToolStripSeparator());
        Item(menu, "Abrir pasta do programa (app)", delegate { AbrirPasta(pastaApp); });
        Item(menu, "Abrir pasta de backups", delegate { AbrirPasta(Path.Combine(raiz, "acervo", "backups")); });
        Item(menu, "Abrir pasta de documentos", delegate { AbrirPasta(Path.Combine(raiz, "documentos")); });
        Item(menu, "Ver registros (logs)", delegate { AbrirPasta(pastaLogs); });
        menu.Items.Add(new ToolStripSeparator());
        Item(menu, "Sair (encerra o servidor)", delegate { Application.ExitThread(); });
        bandeja.ContextMenuStrip = menu;
        Registrar("ícone da bandeja criado");

        relogio = new System.Windows.Forms.Timer();
        relogio.Interval = 4000;
        relogio.Tick += delegate { AtualizarEstado(); };
        relogio.Start();
    }

    static void FecharBandeja()
    {
        try
        {
            if (relogio != null) relogio.Stop();
            if (bandeja != null) { bandeja.Visible = false; bandeja.Dispose(); bandeja = null; }
        }
        catch { }
    }

    static ToolStripMenuItem Item(ContextMenuStrip menu, string texto, EventHandler acao)
    {
        ToolStripMenuItem item = new ToolStripMenuItem(texto);
        item.Click += acao;
        menu.Items.Add(item);
        return item;
    }

    static void AtualizarEstado()
    {
        bool ativo = ServidorResponde();
        if (bandeja == null) return;
        bandeja.Text = ativo
            ? "Silvengard · Atlas vivo — aberto em http://127.0.0.1:" + porta
            : "Silvengard · Atlas vivo — servidor parado";
        if (itemAbrir != null) itemAbrir.Enabled = ativo;
        if (itemParar != null) itemParar.Enabled = ativo;
        if (itemIniciar != null) itemIniciar.Enabled = !ativo;
        if (itemReiniciar != null) itemReiniciar.Enabled = ativo;
    }

    static void AvisarInicio()
    {
        if (bandeja == null) return;
        try
        {
            if (porta == PortaPadrao)
            {
                bandeja.BalloonTipTitle = "Atlas aberto";
                bandeja.BalloonTipText = "O Atlas está em http://127.0.0.1:" + porta
                    + "/. Para encerrar a sessão, clique com o botão direito neste ícone.";
            }
            else
            {
                bandeja.BalloonTipTitle = "Atlas aberto em outra porta";
                bandeja.BalloonTipText = "A porta " + PortaPadrao + " estava ocupada. O Atlas abriu em http://127.0.0.1:"
                    + porta + "/.";
            }
            bandeja.ShowBalloonTip(7000);
        }
        catch (Exception e) { Registrar("balão falhou: " + e.Message); }
    }

    // ---------------------------------------------------------------- servidor

    static bool GarantirServidor(out string erro)
    {
        erro = "";
        int p, pid;
        LerArquivoPorta(out p, out pid);
        if (p > 0 && pid > 0 && ProcessoVivo(pid) && EhAtlas(p))
        {
            porta = p;
            Registrar("reaproveitando servidor já ativo na porta " + p + " (PID " + pid + ")");
            return true;
        }
        ApagarArquivoPorta();

        int escolhida = EscolherPorta();
        if (escolhida <= 0)
        {
            erro = "Não encontrei uma porta livre entre " + PortaPadrao + " e " + PortaMaxima + ".\n\n"
                + "Feche outros programas que estejam usando essas portas e tente novamente.";
            Registrar(erro);
            return false;
        }
        porta = escolhida;
        Registrar("porta escolhida: " + porta);
        return IniciarServidor(out erro);
    }

    static void IniciarComAviso()
    {
        string erro;
        if (!GarantirServidor(out erro)) Erro(erro);
        else { AbrirNavegador(porta); AtualizarEstado(); }
    }

    static void Reiniciar()
    {
        Registrar("reiniciando servidor");
        PararServidor();
        string erro;
        if (!GarantirServidor(out erro)) { Erro(erro); AtualizarEstado(); return; }
        AbrirNavegador(porta);
        AtualizarEstado();
    }

    static bool IniciarServidor(out string erro)
    {
        erro = "";
        PrepararTrabalho();

        string executavel, prefixo;
        if (!ProcurarPython(out executavel, out prefixo))
        {
            erro = "Não encontrei o Python neste computador.\n\n"
                + "O Atlas precisa do Python 3 para funcionar (é gratuito):\n"
                + "  https://www.python.org/downloads/windows/\n\n"
                + "Ao instalar, marque a opção \"Add python.exe to PATH\" e abra o Atlas novamente.";
            Registrar("Python não encontrado");
            return false;
        }
        Registrar("python: " + executavel + " " + prefixo);

        ProcessStartInfo info = new ProcessStartInfo(executavel);
        info.Arguments = prefixo + "\"" + Path.Combine(pastaApp, "serve.py") + "\" --port " + porta + " --no-browser";
        info.WorkingDirectory = pastaApp;
        info.UseShellExecute = false;
        info.CreateNoWindow = true;
        info.WindowStyle = ProcessWindowStyle.Hidden;
        Registrar("executando: " + executavel + " " + info.Arguments);

        try
        {
            servidor = Process.Start(info);
        }
        catch (Exception e)
        {
            erro = "Não foi possível iniciar o servidor do Atlas.\n\n" + e.Message;
            Registrar("falha ao iniciar processo: " + e);
            return false;
        }
        AtribuirAoTrabalho(servidor);
        Registrar("servidor iniciado com PID " + (servidor == null ? 0 : servidor.Id));

        for (int tentativa = 0; tentativa < 80; tentativa++)
        {
            if (EhAtlas(porta)) { Registrar("servidor pronto na porta " + porta); return true; }
            if (servidor != null && servidor.HasExited)
            {
                erro = "O servidor do Atlas encerrou logo ao iniciar (código " + servidor.ExitCode + ").\n\n"
                    + "Verifique se o Python 3 está instalado corretamente.\n"
                    + "Registro detalhado em app\\logs\\atlas-launcher.log.";
                Registrar("servidor encerrou com código " + servidor.ExitCode);
                return false;
            }
            Thread.Sleep(250);
        }
        erro = "O servidor do Atlas não respondeu na porta " + porta + " em 20 segundos.\n\n"
            + "Registro detalhado em app\\logs\\atlas-launcher.log.";
        Registrar("tempo esgotado esperando a porta " + porta);
        return false;
    }

    static void PararServidor()
    {
        if (servidor != null)
        {
            try { if (!servidor.HasExited) { servidor.Kill(); servidor.WaitForExit(4000); } }
            catch { }
            servidor = null;
        }
        int p, pid;
        LerArquivoPorta(out p, out pid);
        if (pid > 0) EncerrarPid(pid, false);
        int daPorta = PidDaPorta(porta);
        if (daPorta > 0) EncerrarPid(daPorta, true);
        ApagarArquivoPorta();
        Registrar("servidor parado");
    }

    /// <summary>Encerra servidor e (quando pedido) todas as instâncias do inicializador.</summary>
    static bool EncerrarTudo(bool incluirOutrasInstancias)
    {
        int registrada, registradoPid;
        LerArquivoPorta(out registrada, out registradoPid);
        bool havia = (registradoPid > 0 && ProcessoVivo(registradoPid)) || ServidorResponde() || servidor != null;
        PararServidor();
        int p, pid;
        LerArquivoPorta(out p, out pid);
        if (pid > 0 && EncerrarPid(pid, false)) havia = true;
        int daPadrao = PidDaPorta(PortaPadrao);
        if (daPadrao > 0 && EncerrarPid(daPadrao, true)) havia = true;
        if (incluirOutrasInstancias) EncerrarOutrasInstancias();
        return havia;
    }

    // ------------------------------------------------------------------ portas

    static int EscolherPorta()
    {
        if (PortaLivre(PortaPadrao)) return PortaPadrao;
        int ocupante = PidDaPorta(PortaPadrao);
        if (ocupante > 0 && EncerrarPid(ocupante, true) && EsperarPorta(PortaPadrao)) return PortaPadrao;
        for (int p = PortaPadrao + 1; p <= PortaMaxima; p++) if (PortaLivre(p)) return p;
        return -1;
    }

    static bool PortaLivre(int p)
    {
        TcpListener sonda = null;
        try
        {
            sonda = new TcpListener(IPAddress.Loopback, p);
            sonda.Start();
            return true;
        }
        catch { return false; }
        finally { if (sonda != null) { try { sonda.Stop(); } catch { } } }
    }

    static bool EsperarPorta(int p)
    {
        for (int i = 0; i < 20; i++)
        {
            if (PortaLivre(p)) return true;
            Thread.Sleep(100);
        }
        return false;
    }

    static int PidDaPorta(int p)
    {
        try
        {
            ProcessStartInfo info = new ProcessStartInfo("netstat", "-ano -p TCP");
            info.UseShellExecute = false;
            info.RedirectStandardOutput = true;
            info.CreateNoWindow = true;
            using (Process proc = Process.Start(info))
            {
                string saida = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit(4000);
                foreach (string bruta in saida.Split('\n'))
                {
                    string linha = bruta.Trim();
                    if (linha.IndexOf("127.0.0.1:" + p + " ", StringComparison.Ordinal) < 0) continue;
                    if (linha.IndexOf("LISTENING", StringComparison.OrdinalIgnoreCase) < 0) continue;
                    string[] partes = linha.Split(new char[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries);
                    int pid;
                    if (partes.Length >= 5 && int.TryParse(partes[partes.Length - 1], out pid)) return pid;
                }
            }
        }
        catch (Exception e) { Registrar("netstat falhou: " + e.Message); }
        return 0;
    }

    static bool EncerrarPid(int pid, bool somentePython)
    {
        if (pid <= 4 || pid == Process.GetCurrentProcess().Id) return false;
        try
        {
            Process alvo = Process.GetProcessById(pid);
            if (somentePython)
            {
                string nome = alvo.ProcessName.ToLowerInvariant();
                if (nome != "python" && nome != "pythonw" && nome != "py" && nome != "pyw") return false;
            }
            alvo.Kill();
            alvo.WaitForExit(4000);
            Registrar("processo " + pid + " encerrado");
            return true;
        }
        catch (Exception e) { Registrar("não consegui encerrar PID " + pid + ": " + e.Message); return false; }
    }

    static bool ProcessoVivo(int pid)
    {
        try { return !Process.GetProcessById(pid).HasExited; }
        catch { return false; }
    }

    static int PortaServidorAtivo()
    {
        int p, pid;
        LerArquivoPorta(out p, out pid);
        if (p > 0 && EhAtlas(p)) return p;
        if (EhAtlas(PortaPadrao)) return PortaPadrao;
        return 0;
    }

    static bool ServidorResponde()
    {
        return porta > 0 && EhAtlas(porta);
    }

    static string StatusTexto()
    {
        int p, pid;
        LerArquivoPorta(out p, out pid);
        if (p > 0 && pid > 0 && ProcessoVivo(pid) && EhAtlas(p))
            return "Atlas aberto em http://127.0.0.1:" + p + " (PID " + pid + ").";
        return "O servidor do Atlas está parado.";
    }

    // -------------------------------------------------------------------- http

    static bool EhAtlas(int p)
    {
        try
        {
            HttpWebRequest pedido = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + p + "/api/defaults");
            pedido.Timeout = 1500;
            pedido.ReadWriteTimeout = 1500;
            pedido.Proxy = null;
            using (HttpWebResponse resposta = (HttpWebResponse)pedido.GetResponse())
            using (StreamReader leitor = new StreamReader(resposta.GetResponseStream(), Encoding.UTF8))
            {
                string corpo = leitor.ReadToEnd();
                return corpo.IndexOf("\"available\": true", StringComparison.Ordinal) >= 0
                    && corpo.IndexOf("\"port\": " + p, StringComparison.Ordinal) >= 0;
            }
        }
        catch { return false; }
    }

    static void AbrirNavegador(int p)
    {
        if (p <= 0) { AtualizarEstado(); return; }
        try
        {
            Process.Start("http://127.0.0.1:" + p + "/");
            Registrar("navegador aberto em http://127.0.0.1:" + p + "/");
        }
        catch (Exception e)
        {
            Registrar("navegador falhou: " + e.Message);
            Erro("Não foi possível abrir o navegador automaticamente.\n\n"
                + "Abra manualmente: http://127.0.0.1:" + p + "/");
        }
    }

    // ------------------------------------------------------------- utilidades

    static void Diagnostico()
    {
        StringBuilder texto = new StringBuilder();
        texto.AppendLine("Silvengard · Atlas vivo — diagnóstico");
        texto.AppendLine("Data: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));
        texto.AppendLine("Pasta do programa: " + raiz);
        texto.AppendLine("serve.py existe: " + File.Exists(Path.Combine(pastaApp, "serve.py")));
        texto.AppendLine("runtime/node.exe existe: " + File.Exists(Path.Combine(pastaApp, "runtime", "node.exe")));
        string exe, prefixo;
        texto.AppendLine("Python encontrado: " + (ProcurarPython(out exe, out prefixo) ? exe : "NÃO"));
        int p, pid;
        LerArquivoPorta(out p, out pid);
        texto.AppendLine("Porta registrada: " + p + " (PID " + pid + ", vivo: " + ProcessoVivo(pid) + ")");
        texto.AppendLine("Porta " + PortaPadrao + " livre: " + PortaLivre(PortaPadrao));
        texto.AppendLine("Servidor respondendo: " + StatusTexto());
        try
        {
            Directory.CreateDirectory(pastaLogs);
            string arquivo = Path.Combine(pastaLogs, "diagnostico.txt");
            File.WriteAllText(arquivo, texto.ToString(), Encoding.UTF8);
            texto.AppendLine();
            texto.AppendLine("Relatório salvo em: " + arquivo);
        }
        catch (Exception e) { texto.AppendLine("não consegui salvar o relatório: " + e.Message); }
        Registrar("diagnóstico executado");
        Informar(texto.ToString());
    }

    static void PrepararTrabalho()
    {
        if (trabalho != IntPtr.Zero) return;
        try
        {
            trabalho = CreateJobObject(IntPtr.Zero, null);
            if (trabalho == IntPtr.Zero) { Registrar("job object indisponível"); return; }
            JOBOBJECT_EXTENDED_LIMIT_INFORMATION info = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
            info.BasicLimitInformation.LimitFlags = 0x2000; // KILL_ON_JOB_CLOSE
            int tamanho = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
            IntPtr ponteiro = Marshal.AllocHGlobal(tamanho);
            try
            {
                Marshal.StructureToPtr(info, ponteiro, false);
                SetInformationJobObject(trabalho, 9, ponteiro, (uint)tamanho);
            }
            finally { Marshal.FreeHGlobal(ponteiro); }
        }
        catch (Exception e) { Registrar("job object falhou: " + e.Message); }
    }

    static void AtribuirAoTrabalho(Process processo)
    {
        try { if (trabalho != IntPtr.Zero && processo != null) AssignProcessToJobObject(trabalho, processo.Handle); }
        catch (Exception e) { Registrar("assign job falhou: " + e.Message); }
    }

    static bool ProcurarPython(out string executavel, out string prefixo)
    {
        executavel = null;
        prefixo = "";
        List<string> candidatos = new List<string>();
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] versoes = new string[] { "313", "312", "311", "310", "39", "314" };
        foreach (string v in versoes)
        {
            candidatos.Add(Path.Combine(local, "Programs", "Python", "Python" + v, "pythonw.exe"));
            candidatos.Add(Path.Combine(local, "Programs", "Python", "Python" + v, "python.exe"));
        }
        candidatos.Add(Path.Combine(local, "Python", "pythoncore-3.14-64", "pythonw.exe"));
        candidatos.Add(Path.Combine(local, "Python", "pythoncore-3.14-64", "python.exe"));
        candidatos.Add(Path.Combine(pastaApp, "runtime", "pythonw.exe"));
        candidatos.AddRange(NoPath("pythonw.exe"));
        candidatos.AddRange(NoPath("python.exe"));
        foreach (string c in candidatos)
        {
            if (File.Exists(c)) { executavel = c; prefixo = ""; return true; }
        }
        string sistema = Environment.GetFolderPath(Environment.SpecialFolder.System);
        string pyw = Path.Combine(sistema, "pyw.exe");
        if (!File.Exists(pyw)) pyw = Path.Combine(Path.GetDirectoryName(sistema), "pyw.exe");
        if (File.Exists(pyw)) { executavel = pyw; prefixo = "-3 "; return true; }
        return false;
    }

    static List<string> NoPath(string nome)
    {
        List<string> achados = new List<string>();
        string caminho = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrEmpty(caminho)) return achados;
        foreach (string pasta in caminho.Split(';'))
        {
            if (string.IsNullOrEmpty(pasta)) continue;
            try
            {
                string completo = Path.Combine(pasta.Trim('"'), nome);
                if (File.Exists(completo)) achados.Add(completo);
            }
            catch { }
        }
        return achados;
    }

    static string ArquivoPorta() { return Path.Combine(pastaLogs, "atlas.port"); }

    static void LerArquivoPorta(out int p, out int pid)
    {
        p = 0;
        pid = 0;
        try
        {
            if (!File.Exists(ArquivoPorta())) return;
            foreach (string linha in File.ReadAllLines(ArquivoPorta()))
            {
                string t = linha.Trim();
                if (t.StartsWith("porta=", StringComparison.OrdinalIgnoreCase)) int.TryParse(t.Substring(6), out p);
                else if (t.StartsWith("pid=", StringComparison.OrdinalIgnoreCase)) int.TryParse(t.Substring(4), out pid);
            }
        }
        catch { }
    }

    static void ApagarArquivoPorta()
    {
        try { if (File.Exists(ArquivoPorta())) File.Delete(ArquivoPorta()); }
        catch { }
    }

    static void AbrirPasta(string pasta)
    {
        try
        {
            if (!Directory.Exists(pasta)) Directory.CreateDirectory(pasta);
            Process.Start("explorer.exe", "\"" + pasta + "\"");
        }
        catch (Exception e) { Erro("Não foi possível abrir a pasta.\n\n" + e.Message); }
    }

    /// <summary>Grava sempre, para que qualquer falha deixe rastro.</summary>
    static void Registrar(string texto)
    {
        try
        {
            Directory.CreateDirectory(pastaLogs);
            File.AppendAllText(Path.Combine(pastaLogs, "atlas-launcher.log"),
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff") + "  " + texto + Environment.NewLine,
                Encoding.UTF8);
        }
        catch { }
    }

    static void Erro(string texto)
    {
        Registrar("ERRO: " + texto.Replace(Environment.NewLine, " | "));
        try { MessageBox.Show(texto, Titulo, MessageBoxButtons.OK, MessageBoxIcon.Warning); }
        catch { }
    }

    static void Informar(string texto)
    {
        // Avisos de linha de comando nunca abrem janela: isso travaria scripts.
        Registrar(texto.Replace(Environment.NewLine, " | "));
        EscreverNoConsole(texto);
    }

    static void EscreverNoConsole(string texto)
    {
        try
        {
            if (!AttachConsole(-1)) return; // sem console (duplo clique): só o log
            Console.WriteLine(texto);
            Console.Out.Flush();
            FreeConsole();
        }
        catch { }
    }

    // -------------------------------------------------- integração com Windows

    static IntPtr trabalho = IntPtr.Zero;

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr CreateJobObject(IntPtr atributos, string nome);

    [DllImport("kernel32.dll")]
    static extern bool SetInformationJobObject(IntPtr trabalho, int tipo, IntPtr informacao, uint tamanho);

    [DllImport("kernel32.dll")]
    static extern bool AssignProcessToJobObject(IntPtr trabalho, IntPtr processo);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool AttachConsole(int processoId);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool FreeConsole();

    [StructLayout(LayoutKind.Sequential)]
    struct JOBOBJECT_BASIC_LIMIT_INFORMATION
    {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct IO_COUNTERS
    {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
    {
        public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
        public IO_COUNTERS IoInfo;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryUsed;
        public UIntPtr PeakJobMemoryUsed;
    }
}
