"""
Module de sanitization et de protection contre les injections de prompt indirectes (P4).
Protège les modèles IA et le back-office contre :
- L'injection de prompt indirecte (OWASP LLM01 / ASI01) stockée dans les pitchs, signalements et hackathons
- Les attaques XSS stockées et balises HTML malveillantes
- Les caractères de contrôle masqués et overrides bidirectionnels Unicode (bidi spoofing)
"""

import re
from django.utils.html import strip_tags

# Caractères Unicode invisibles ou de contrôle directionnel (Bidi spoofing, zero-width)
DANGEROUS_UNICODE_CHARS = {
    '\u202a',  # Left-to-Right Embedding
    '\u202b',  # Right-to-Left Embedding
    '\u202c',  # Pop Directional Formatting
    '\u202d',  # Left-to-Right Override
    '\u202e',  # Right-to-Left Override
    '\u2066',  # Left-to-Right Isolate
    '\u2067',  # Right-to-Left Isolate
    '\u2068',  # First Strong Isolate
    '\u2069',  # Pop Directional Isolate
    '\u200b',  # Zero-width space
    '\u200c',  # Zero-width non-joiner
    '\u200d',  # Zero-width joiner
    '\ufeff',  # Byte order mark / zero-width no-break space
}

# Signatures d'injections de prompt et de détournement d'instructions LLM
INDIRECT_INJECTION_SIGNATURES = [
    'ignore previous instructions',
    'ignore all instructions',
    'disregard previous instructions',
    'oublie toutes les instructions',
    'oublie les instructions',
    'system override',
    'system prompt',
    'mode sans restriction',
    'developer mode',
    'jailbreak',
    '[inst]',
    '[/inst]',
    '<|im_start|>',
    '<|im_end|>',
    '### system',
    '### assistant',
    '### human',
    '### instructions',
    'new role:',
    'you are now',
]


def strip_control_and_invisible_chars(text: str, allow_multiline: bool = True) -> str:
    """
    Supprime les octets nuls, les caractères de contrôle non imprimables
    et les caractères Unicode invisibles ou de manipulation de flux de lecture.
    """
    if not text:
        return ""

    cleaned_chars = []
    allowed_ctrl = {'\n', '\r', '\t'} if allow_multiline else set()

    for ch in text:
        # Exclure les caractères Unicode dangereux identifiés
        if ch in DANGEROUS_UNICODE_CHARS:
            continue
        # Exclure les caractères de contrôle ASCII (0 à 31 et 127) sauf les sauts de ligne autorisés
        code = ord(ch)
        if (code < 32 and ch not in allowed_ctrl) or code == 127:
            continue
        cleaned_chars.append(ch)

    return "".join(cleaned_chars)


def sanitize_text(text: str, max_length: int = 1000, allow_multiline: bool = True) -> str:
    """
    Assainit un texte utilisateur :
    1. Supprime les caractères de contrôle et Unicode invisibles
    2. Supprime toutes les balises HTML/XML (anti-XSS)
    3. Normalise les espaces superflus
    4. Tronque à la longueur maximale autorisée
    """
    if not isinstance(text, str):
        return ""

    # Nettoyage des caractères de contrôle
    cleaned = strip_control_and_invisible_chars(text, allow_multiline=allow_multiline)

    # Suppression stricte des balises HTML
    cleaned = strip_tags(cleaned)

    # Normalisation des retours à la ligne consécutifs excessifs
    if allow_multiline:
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
    else:
        cleaned = re.sub(r'\s+', ' ', cleaned)

    cleaned = cleaned.strip()

    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length].strip()

    return cleaned


def detect_indirect_prompt_injection(text: str) -> tuple[bool, str]:
    """
    Analyse un contenu utilisateur pour détecter d'éventuelles tentatives
    d'injection de prompt indirectes (ex: dans un pitch de startup ou hackathon).
    Retourne (is_suspicious: bool, reason: str).
    """
    if not text:
        return False, ""

    normalized = text.lower()

    # Détection des signatures d'injection connues
    for sig in INDIRECT_INJECTION_SIGNATURES:
        if sig in normalized:
            return True, f"Signature d'injection détectée : '{sig}'"

    # Détection des faux séparateurs de message chat / rôle système en début de ligne
    line_start_patterns = [
        r'^\s*system\s*:',
        r'^\s*assistant\s*:',
        r'^\s*jury\s*instructions?\s*:',
        r'^\s*evaluation\s*override\s*:',
    ]
    for pattern in line_start_patterns:
        if re.search(pattern, normalized, re.MULTILINE):
            return True, "Tentative d'usurpation de rôle système ou jury détectée"

    return False, ""


def sanitize_short_identifier(text: str, max_length: int = 80) -> str:
    """Assainit un nom court (nom de citoyen, projet, guilde, équipe)."""
    return sanitize_text(text, max_length=max_length, allow_multiline=False)


def sanitize_multiline_content(text: str, max_length: int = 1500) -> str:
    """Assainit un texte descriptif long (pitch, détails de signalement, description)."""
    return sanitize_text(text, max_length=max_length, allow_multiline=True)
