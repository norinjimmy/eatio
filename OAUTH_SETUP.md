# OAuth Setup Instructions

## Google Sign In

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj ett befintligt
3. Aktivera "Google+ API"
4. Gå till "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Konfigurera OAuth consent screen:
   - User Type: External
   - App name: Eatio
   - User support email: din@email.se
   - Authorized domains: supabase.co
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: Eatio Web
   - Authorized redirect URIs: `https://tburnenhlrnlgiismhdg.supabase.co/auth/v1/callback`
7. Kopiera Client ID och Client Secret

### Konfigurera i Supabase:
1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Gå till "Authentication" → "Providers"
4. Aktivera "Google"
5. Klistra in Client ID och Client Secret
6. Spara

---

## Apple Sign In

1. Gå till [Apple Developer Portal](https://developer.apple.com/account)
2. Gå till "Certificates, Identifiers & Profiles"
3. Klicka på "Identifiers" och skapa en ny App ID:
   - Description: Eatio
   - Bundle ID: com.eatio.app (eller ditt eget)
   - Capabilities: Aktivera "Sign In with Apple"
4. Skapa en Service ID:
   - Description: Eatio Web
   - Identifier: com.eatio.service
   - Aktivera "Sign In with Apple"
   - Configure:
     - Primary App ID: Välj din App ID från steg 3
     - Domains: tburnenhlrnlgiismhdg.supabase.co
     - Return URLs: `https://tburnenhlrnlgiismhdg.supabase.co/auth/v1/callback`
5. Skapa en Key för Sign In with Apple:
   - Key Name: Eatio Apple Sign In Key
   - Aktivera "Sign In with Apple"
   - Configure: Välj din App ID
   - Ladda ner .p8-filen (detta är din Private Key)
   - Spara Key ID

### Konfigurera i Supabase:
1. Gå till [Supabase Dashboard](https://supabase.com/dashboard)
2. Välj ditt projekt
3. Gå till "Authentication" → "Providers"
4. Aktivera "Apple"
5. Fyll i:
   - Services ID: com.eatio.service
   - Team ID: (hittas i Apple Developer Portal, längst upp till höger)
   - Key ID: från steg 5 ovan
   - Private Key: innehållet från .p8-filen
6. Spara

---

## Testning

### Lokal testning med OAuth:
OAuth fungerar inte direkt på localhost. Du har två alternativ:

1. **Använd Supabase CLI med lokal redirect:**
   ```bash
   npx supabase start
   ```

2. **Deploy till en testmiljö:**
   - Deploy till Vercel/Netlify
   - Uppdatera redirect URLs i Google/Apple
   - Testa med den publika URL:en

### Email/Password fungerar direkt lokalt!
Du kan testa email/password signup och login direkt på localhost:5000.

---

## Vad fungerar nu?

✅ **Email/Password** - Fungerar direkt, inga extra steg
✅ **Magic Link** - Fungerar direkt, inga extra steg  
⚠️ **Google Sign In** - Kräver Google Cloud konfiguration ovan
⚠️ **Apple Sign In** - Kräver Apple Developer konfiguration ovan

## Nästa steg

1. Testa email/password signup först
2. Konfigurera Google OAuth om du vill ha Google Sign In
3. Konfigurera Apple Sign In om du vill ha Apple-inloggning
4. Deploy appen för att testa OAuth providers

## Tips

- För development: Använd email/password - det är enklast!
- För produktion: Lägg till Google och Apple för bästa användarupplevelse
- Magic Link är bra för passwordless, men email/password ger användare mer kontroll
