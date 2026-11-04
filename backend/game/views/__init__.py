"""Vues de l'API Youth City, découpées par district.

Les URL (`game/urls.py`) référencent toujours `views.<nom_de_la_vue>` : ce package
ré-exporte donc toutes les vues.
"""
from game.views.common import *  # noqa: F401,F403
from game.views.game_loop import *  # noqa: F401,F403
from game.views.residential import *  # noqa: F401,F403
from game.views.campus import *  # noqa: F401,F403
from game.views.business import *  # noqa: F401,F403
from game.views.finance import *  # noqa: F401,F403
from game.views.dilemmas import *  # noqa: F401,F403
from game.views.accounts import *  # noqa: F401,F403
from game.views.market import *  # noqa: F401,F403
from game.views.startup import *  # noqa: F401,F403
from game.views.hub import *  # noqa: F401,F403
from game.views.admin_moderation import *  # noqa: F401,F403
from game.views.nova import *  # noqa: F401,F403
from game.views.passport import *  # noqa: F401,F403
