from django.urls import path
from .views import ChatSessionListCreateView, ChatView, ChatHistoryView

urlpatterns = [
    path('sessions/', ChatSessionListCreateView.as_view(), name='chat-sessions'),
    path('chat/', ChatView.as_view(), name='chat'),
    path('sessions/<int:session_id>/history/', ChatHistoryView.as_view(), name='chat-history'),
]
