from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """Limits login attempts per IP to prevent brute-force credential stuffing."""
    scope = 'auth_login'

class RegisterRateThrottle(AnonRateThrottle):
    """Limits new account registrations per IP to mitigate spam and automated bots."""
    scope = 'auth_register'

class NovaChatRateThrottle(AnonRateThrottle):
    """Limits AI mentor chat interactions per IP to mitigate quota exhaustion and automated spam (OWASP LLM04/LLM06)."""
    scope = 'nova_chat'

