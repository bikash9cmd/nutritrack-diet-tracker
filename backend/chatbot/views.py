from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, serializers
from .models import ChatSession, ChatMessage
from .rag_service import chat_with_rag


class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']


class ChatSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatView(APIView):
    """
    POST /api/chatbot/chat/
    Body: { "session_id": int (optional), "message": str }
    """

    def post(self, request):
        message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id')

        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Get or create a session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Auto-title from first message
            title = message[:50] + ('…' if len(message) > 50 else '')
            session = ChatSession.objects.create(user=request.user, title=title)

        # Build conversation history for OpenAI
        history = [msg.to_openai_format() for msg in session.messages.all()]

        # Save user message
        ChatMessage.objects.create(session=session, role='user', content=message)

        # Call RAG pipeline
        try:
            reply = chat_with_rag(request.user, message, history)
        except Exception as e:
            return Response({'error': f'AI service error: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Save assistant reply
        ChatMessage.objects.create(session=session, role='assistant', content=reply)
        session.save()  # Update updated_at

        return Response({
            'session_id': session.id,
            'message': reply,
            'session_title': session.title,
        })


class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        return ChatMessage.objects.filter(
            session__id=session_id,
            session__user=self.request.user
        )
