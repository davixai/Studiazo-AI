# De refăcut când scalăm aplicația

Lucruri simplificate intenționat pentru concurs/demo. Înainte de lansarea publică, le refacem.

## 1. Confirmarea emailului la creare cont (Supabase Auth)

**Acum:** „Confirm email” este **dezactivat** (Supabase → Authentication → Sign In / Providers → Email). Contul se creează și utilizatorul intră direct în `/bun-venit`.

**De ce:** serviciul de email implicit al Supabase are o limită foarte mică de emailuri pe oră pentru tot proiectul. La teste dese apărea eroarea `over_email_send_rate_limit` („Prea multe încercări într-un timp scurt…”) și nu se mai puteau crea conturi.

**La scalare:**
1. Configurăm un SMTP propriu (ex. Resend, Postmark, Brevo): Authentication → Emails → SMTP Settings, cu un domeniu verificat (SPF/DKIM).
2. Ridicăm limita de emailuri: Authentication → Rate Limits → „emails sent per hour” (se poate modifica doar după ce există SMTP propriu).
3. Reactivăm „Confirm email”. Codul tratează deja ambele cazuri (`src/features/auth/actions.ts`, `signUp`): fără sesiune, afișează mesajul „Ți-am trimis un email…”.
4. Verificăm șablonul emailului în română și că linkul duce la `/auth/callback?next=/bun-venit` (URL-ul aplicației trebuie trecut la Authentication → URL Configuration).

**Fără confirmare, riscul este** că oricine poate crea conturi cu adrese care nu sunt ale lui. Pentru demo e acceptabil; pentru producție, nu.

Notă: și resetarea parolei trimite email, deci are aceeași limită până la pasul 1.
