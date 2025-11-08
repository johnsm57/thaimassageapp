import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Backend URL - Replace with your actual backend URL
const SOCKET_URL = 'http://192.168.100.11:5000'; // e.g., 'http://192.168.1.100:5000'
const API_URL = 'http://192.168.100.11:5000/api';

const ChatScreen = ({ route }) => {
  // Get conversation details from navigation params
  const { conversationId, receiverId, receiverName, currentUserId } = route.params;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    initializeSocket();
    loadMessages();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
      socketRef.current.emit('user_connected', currentUserId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    // Receive new message
    socketRef.current.on('receive_message', (data) => {
      const { message } = data;
      
      // Add message to state
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: message._id,
          text: message.text,
          time: formatTime(message.createdAt),
          isSent: false,
          seen: false,
          image: message.imageUrl,
        },
      ]);

      // Mark as delivered
      socketRef.current.emit('message_delivered', message._id);
      
      // Mark as read (since user is in the chat)
      socketRef.current.emit('message_read', {
        messageId: message._id,
        conversationId: conversationId,
        userId: currentUserId,
      });
    });

    // Message sent confirmation
    socketRef.current.on('message_sent', (data) => {
      const { message } = data;
      
      // Update message with server ID
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.tempId === message.tempId
            ? {
                ...msg,
                id: message._id,
                time: formatTime(message.createdAt),
              }
            : msg
        )
      );
    });

    // Message status updates (delivered/read)
    socketRef.current.on('message_status_update', (data) => {
      const { messageId, isDelivered, isRead } = data;
      
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                delivered: isDelivered || msg.delivered,
                seen: isRead || msg.seen,
              }
            : msg
        )
      );
    });

    // User online status
    socketRef.current.on('user_status', (data) => {
      const { userId, isOnline } = data;
      if (userId === receiverId) {
        setIsReceiverOnline(isOnline);
      }
    });

    // Typing indicator
    socketRef.current.on('user_typing', (data) => {
      const { userId, isTyping } = data;
      if (userId === receiverId) {
        setIsTyping(isTyping);
      }
    });

    // Error handling
    socketRef.current.on('message_error', (data) => {
      console.error('Message error:', data.error);
      alert('Failed to send message. Please try again.');
    });
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/messages/${conversationId}`
      );

      const formattedMessages = response.data.map((msg) => ({
        id: msg._id,
        text: msg.text,
        time: formatTime(msg.createdAt),
        isSent: msg.sender._id === currentUserId,
        seen: msg.isRead,
        delivered: msg.isDelivered,
        image: msg.imageUrl,
      }));

      setMessages(formattedMessages);

      // Mark all as read
      await axios.post(`${API_URL}/messages/mark-read`, {
        conversationId,
        userId: currentUserId,
      });
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleSend = () => {
    if (inputText.trim()) {
      const tempId = Date.now().toString();
      const newMessage = {
        id: tempId,
        tempId: tempId,
        text: inputText,
        time: formatTime(new Date()),
        isSent: true,
        seen: false,
        delivered: false,
      };

      // Add message to UI immediately
      setMessages([...messages, newMessage]);
      
      // Emit to server
      socketRef.current.emit('send_message', {
        conversationId: conversationId,
        senderId: currentUserId,
        receiverId: receiverId,
        text: inputText,
        messageType: 'text',
        tempId: tempId,
      });

      setInputText('');
      
      // Stop typing indicator
      socketRef.current.emit('typing', {
        userId: currentUserId,
        receiverId: receiverId,
        isTyping: false,
      });
    }
  };

  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 1,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const imageUri = response.assets[0].uri;
        
        // In production, upload image to cloud storage (AWS S3, Cloudinary, etc.)
        // For now, we'll send the local URI
        
        const tempId = Date.now().toString();
        const newMessage = {
          id: tempId,
          tempId: tempId,
          image: imageUri,
          time: formatTime(new Date()),
          isSent: true,
          seen: false,
          delivered: false,
        };

        setMessages([...messages, newMessage]);

        // Emit to server
        socketRef.current.emit('send_message', {
          conversationId: conversationId,
          senderId: currentUserId,
          receiverId: receiverId,
          messageType: 'image',
          imageUrl: imageUri, // In production, this should be the cloud URL
          tempId: tempId,
        });
      }
    });
  };

  const handleTyping = (text) => {
    setInputText(text);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing status
    if (text.length > 0) {
      socketRef.current.emit('typing', {
        userId: currentUserId,
        receiverId: receiverId,
        isTyping: true,
      });

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit('typing', {
          userId: currentUserId,
          receiverId: receiverId,
          isTyping: false,
        });
      }, 2000);
    } else {
      socketRef.current.emit('typing', {
        userId: currentUserId,
        receiverId: receiverId,
        isTyping: false,
      });
    }
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isSent ? styles.sentContainer : styles.receivedContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isSent ? styles.sentBubble : styles.receivedBubble,
        ]}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.messageImage} />
        ) : (
          <Text style={[styles.messageText, item.isSent && styles.sentText]}>
            {item.text}
          </Text>
        )}
      </View>
      <View style={[styles.messageInfo, item.isSent && styles.sentInfo]}>
        {item.isSent && (
          <Text style={styles.seenText}>
            {item.seen ? 'Seen' : item.delivered ? 'Delivered' : 'Sent'}
          </Text>
        )}
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    </View>
  );

  const renderDateSeparator = () => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateText}>Today</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#D96073" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E8C4D4" />
      
      {/* Header */}
      <LinearGradient
        colors={['#DEAAB2', '#FFDDE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{receiverName}</Text>
          <Text style={styles.headerSubtitle}>
            {isTyping
              ? 'Typing...'
              : isReceiverOnline
              ? 'Active now 🟢'
              : 'Offline'}
          </Text>
        </View>
      </LinearGradient>

      {/* Chat Area */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={renderDateSeparator}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleImagePicker}
          >
            <View style={styles.galleryIcon}>
              <View style={styles.iconSquare} />
              <View style={[styles.iconSquare, styles.iconSquareSmall]} />
            </View>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Enter your message..."
            placeholderTextColor="#9B868E"
            value={inputText}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
          />

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE2E0',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    paddingTop: Platform.OS === 'ios' ? 44 : 72,
    height: 129,
    width: '100%',
    shadowColor: '#D7B5BA',
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    paddingBottom: 10,
  },
  backIcon: {
    fontSize: 28,
    color: '#6B4C5C',
    fontWeight: '300',
  },
  headerTextContainer: {
    flex: 1,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A2C3A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B4C5C',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateText: {
    fontSize: 13,
    color: '#8B7B7B',
    fontWeight: '500',
  },
  messageContainer: {
    marginVertical: 6,
    maxWidth: '85%',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
  },
  receivedBubble: {
    backgroundColor: '#FFF6EF',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 56,
    shadowColor: '#8C8C8C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  sentBubble: {
    backgroundColor: '#D96073',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 56,
    borderBottomLeftRadius: 10,
    shadowColor: '#8C8C8C',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#262628',
    lineHeight: 20,
  },
  sentText: {
    color: '#4A2C3A',
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  messageInfo: {
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sentInfo: {
    justifyContent: 'flex-end',
  },
  timeText: {
    fontSize: 11,
    color: '#9B8B8B',
    marginLeft: 8,
  },
  seenText: {
    fontSize: 11,
    color: '#9B8B8B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#EDCFC9',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
  },
  galleryButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  galleryIcon: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  iconSquare: {
    width: 16,
    height: 16,
    borderWidth: 2.5,
    borderColor: '#A67186',
    borderRadius: 4,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  iconSquareSmall: {
    width: 11,
    height: 11,
    top: 9,
    left: 9,
    backgroundColor: 'transparent',
    borderWidth: 2.5,
    borderColor: '#A67186',
    borderRadius: 3,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 15,
    color: '#5A4048',
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 22,
    color: '#A67186',
    fontWeight: 'bold',
  },
});

export default ChatScreen;