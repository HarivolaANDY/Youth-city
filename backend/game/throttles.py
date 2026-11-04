from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limits login attempts per IP to prevent brute-force credential stuffing."""
    scope = 'auth_login'


class RegisterRateThrottle(AnonRateThrottle):
    """Limits new account registrations per IP to mitigate spam and automated bots."""
    scope = 'auth_register'


class NovaChatRateThrottle(UserRateThrottle):
    """
    Limite par compte les échanges avec le mentor IA (OWASP LLM04/LLM06).
    Le chat exige un compte : un throttle « anonyme » ne limiterait aucun joueur connecté.
    """
    scope = 'nova_chat'


class NovaChatDailyThrottle(UserRateThrottle):
    """Plafond quotidien par compte : borne le coût d'un fournisseur IA payant."""
    scope = 'nova_chat_daily'


class PassportVerifyRateThrottle(SimpleRateThrottle):
    """Limite par IP la vérification publique des passeports (anti-énumération), connecté ou non."""
    scope = 'passport_verify'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}
