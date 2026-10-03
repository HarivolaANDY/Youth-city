from django.urls import path
from game import views

urlpatterns = [
    # Game Loop & Citizen Status
    path('game/state/', views.get_game_state, name='game-state'),
    path('game/advance_time/', views.advance_time, name='advance-time'),
    path('game/sleep/', views.rest_and_sleep, name='rest-and-sleep'),
    path('game/housing/', views.change_housing, name='change-housing'),
    path('game/reset/', views.reset_game, name='reset-game'),

    # Campus District
    path('campus/courses/', views.list_courses, name='list-courses'),
    path('campus/courses/<str:key>/complete/', views.complete_course, name='complete-course'),

    # Business District
    path('business/jobs/', views.list_jobs, name='list-jobs'),
    path('business/jobs/<str:key>/hire/', views.hire_job, name='hire-job'),
    path('business/work_shift/', views.work_shift, name='work-shift'),

    # Finance District
    path('finance/deposit/', views.deposit_savings, name='deposit-savings'),
    path('finance/withdraw/', views.withdraw_savings, name='withdraw-savings'),
    path('finance/transactions/', views.list_transactions, name='list-transactions'),

    # Residential District
    path('residential/properties/', views.list_properties, name='list-properties'),

    # Dilemmas & Random Events
    path('dilemmas/active/', views.get_active_dilemma, name='active-dilemma'),
    path('dilemmas/resolve/', views.resolve_dilemma, name='resolve-dilemma'),
]
