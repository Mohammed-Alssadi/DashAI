export function ConnectFooter() {
  return (
    <div className="text-center text-xs text-muted-foreground pt-6 border-t border-border/40">
      <p>
        بتسجيل الدخول وربط متجرك، أنت توافق على{" "}
        <a href="#" className="underline hover:text-foreground transition-colors">شروط الخدمة</a>
        {" "}و{" "}
        <a href="#" className="underline hover:text-foreground transition-colors">سياسة الخصوصية</a>.
      </p>
    </div>
  )
}
