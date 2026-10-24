from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from game import views

urlpatterns = [
    # Auth & Accounts (§42, §47)
    path('auth/register/', views.register_user, name='auth-register'),
    path('auth/login/', views.login_user, name='auth-login'),
    path('auth/me/', views.get_current_user, name='auth-me'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Character Creation & Customization (§14, §47)
    path('character/customize/', views.customize_character, name='character-customize'),

    # Game Loop & Citizen Status
    path('game/state/', views.get_game_state, name='game-state'),
    path('game/advance_time/', views.advance_time, name='advance-time'),
    path('game/advance_day/', views.advance_day, name='advance-day'),
    path('game/sleep/', views.rest_and_sleep, name='rest-and-sleep'),
    path('game/housing/', views.change_housing, name='change-housing'),
    path('game/reset/', views.reset_game, name='reset-game'),

    # Campus District
    path('campus/courses/', views.list_courses, name='list-courses'),
    path('campus/courses/<str:key>/complete/', views.complete_course, name='complete-course'),
    path('campus/courses/<str:key>/validate-quiz/', views.validate_course_quiz, name='validate-course-quiz'),

    # Business District & Freelance (§8, §21, §52)
    path('business/jobs/', views.list_jobs, name='list-jobs'),
    path('business/jobs/<str:key>/hire/', views.hire_job, name='hire-job'),
    path('business/jobs/<str:key>/interview/', views.simulate_interview, name='simulate-interview'),
    path('business/work_shift/', views.work_shift, name='work-shift'),
    path('business/freelance/', views.list_freelance_gigs, name='freelance-gigs-list'),
    path('business/freelance/<str:key>/complete/', views.complete_freelance_gig, name='freelance-gig-complete'),

    # Finance District
    path('finance/deposit/', views.deposit_savings, name='deposit-savings'),
    path('finance/withdraw/', views.withdraw_savings, name='withdraw-savings'),
    path('finance/transactions/', views.list_transactions, name='list-transactions'),

    # Residential District
    path('residential/properties/', views.list_properties, name='list-properties'),

    # Market District (§11, §19)
    path('market/items/', views.list_market_items, name='list-market-items'),
    path('market/buy/', views.buy_market_item, name='buy-market-item'),

    # Startup District (§12, §24)
    path('startup/projects/', views.list_startup_projects, name='list-startup-projects'),
    path('startup/create/', views.create_startup_project, name='create-startup-project'),
    path('startup/<str:key>/action/', views.advance_startup_action, name='advance-startup-action'),
    path('startup/<str:key>/grant/', views.claim_incubator_grant, name='claim-incubator-grant'),

    # City Hub : Guildes, Hackathons & Leaderboards (§13, §29, §30, §31, §33)
    path('hub/guilds/', views.list_guilds, name='list-guilds'),
    path('hub/guilds/<str:key>/join/', views.join_guild, name='join-guild'),
    path('hub/guilds/<str:key>/leave/', views.leave_guild, name='leave-guild'),
    path('hub/hackathons/', views.list_hackathons, name='list-hackathons'),
    path('hub/hackathons/<str:key>/participate/', views.participate_hackathon, name='participate-hackathon'),
    path('hub/leaderboard/', views.get_community_leaderboard, name='community-leaderboard'),

    # Dilemmas & Random Events (§25 & §26)
    path('dilemmas/active/', views.get_active_dilemma, name='active-dilemma'),
    path('dilemmas/trigger/', views.trigger_dynamic_event, name='trigger-dynamic-event'),
    path('dilemmas/resolve/', views.resolve_dilemma, name='resolve-dilemma'),

    # Admin Back-Office, Moderation & Impact Analytics (§43, §45, §46)
    path('admin/overview/', views.get_admin_overview, name='admin-overview'),
    path('admin/grant_stipend/', views.grant_admin_stipend, name='admin-grant-stipend'),
    path('moderation/reports/', views.list_moderation_reports, name='moderation-reports'),
    path('moderation/reports/create/', views.create_moderation_report, name='moderation-create-report'),
    path('moderation/reports/<int:report_id>/resolve/', views.resolve_moderation_report, name='moderation-resolve-report'),

    # NOVA AI Mentor Chat & Proactive Next Action (§27, §28, §57)
    path('nova/chat/', views.chat_with_nova, name='nova-chat'),
    path('nova/proactive-guidance/', views.get_nova_proactive_guidance, name='nova-proactive-guidance'),

    # Career Passport & Vérification Publique (§34, §35)
    path('passport/', views.get_career_passport, name='career-passport'),
    path('passport/verify/<str:code>/', views.verify_career_passport, name='verify-career-passport'),

    # Annuaire Citoyen & Messagerie Directe (§29)
    path('hub/directory/', views.list_citizen_directory, name='hub-directory'),
    path('hub/messages/', views.list_citizen_messages, name='hub-messages'),
    path('hub/messages/send/', views.send_citizen_message, name='hub-send-message'),
    path('hub/messages/<int:message_id>/read/', views.mark_message_read, name='hub-mark-message-read'),
]

