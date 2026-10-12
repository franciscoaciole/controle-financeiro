function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-dvh bg-bg text-text grid lg:grid-cols-2">
      {/* Lado do formulário */}
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          {/* Marca pequena, visível só no celular */}
          <div className="flex items-center gap-2.5 mb-12">
            <img src="/logo.jpg" alt="Finan+" className="w-9 h-9 mix-blend-screen" />
            <span className="font-display text-[15px] font-semibold">Finan+</span>
          </div>

          <h1 className="font-display text-[30px] font-semibold tracking-tight">
            {title}
            <span className="text-pos">.</span>
          </h1>
          <p className="text-muted text-[13px] mt-2 mb-8">{subtitle}</p>

          {children}

          <div className="mt-8 text-center text-[12.5px] text-muted">{footer}</div>
        </div>
      </div>

      {/* Lado da marca (escondido em telas pequenas) */}
      <div className="relative hidden lg:flex items-center justify-center overflow-hidden border-l border-panel-border px-12">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 25% 15%, rgba(237,234,224,0.10), transparent 55%), radial-gradient(circle at 80% 90%, rgba(78,217,160,0.10), transparent 50%)',
          }}
        />

        <div className="relative flex flex-col items-center text-center">
          <img src="/logo.jpg" alt="Finan+" className="w-40 h-40 mix-blend-screen" />
          <h2 className="font-display text-[34px] font-semibold tracking-tight mt-6">
            Finan+
          </h2>
          <p className="text-muted text-[14px] mt-2 max-w-xs">
            Suas receitas e despesas em um só lugar, de forma simples.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
