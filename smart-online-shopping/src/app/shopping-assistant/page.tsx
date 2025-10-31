"use client";

import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import jsPDF from "jspdf";
import styles from "./shopping-assistant.module.css";
import { ShoppingBag, Download, Mic, Send, ArrowLeft, Ruler, Truck, RotateCcw, Tag, VolumeX, Shirt, Image as ImageIcon, X } from "lucide-react";
import { User } from "../types";
import { getCurrentUser } from "../utils/storage/localStorage";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  image?: string;
  imageType?: string;
}

export default function ShoppingAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Smart Shopping Assistant. I'm here to help you with all your fashion shopping needs! I can answer questions about sizing, delivery options, returns & exchanges, product recommendations, and more. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<string>("");
  const [showClosingRemarks, setShowClosingRemarks] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Load user data from localStorage using the proper utility
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    } else {
      // Redirect to login if no user data
      window.location.href = "/auth/login";
    }
  }, []);

  const generateResponse = async (userMessage: string, image?: string, imageType?: string): Promise<string> => {
    try {
      const response = await fetch("/api/shopping-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          userId: currentUser?.id,
          userName: currentUser?.name,
          userEmail: currentUser?.email,
          image: image,
          imageType: imageType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from shopping assistant");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error generating response:", error);
      return `I apologize, but I'm experiencing technical difficulties right now. Please try again in a moment. In the meantime, you can:

• Browse our product catalog
• Check your order history in the dashboard
• View our sizing guide and delivery information

I'll be back to help you shortly!`;
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim() || (selectedImage ? "📷 Image uploaded for analysis" : ""),
      sender: "user",
      timestamp: new Date(),
      image: selectedImage || undefined,
      imageType: selectedImageType || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const imageToSend = selectedImage;
    const imageTypeToSend = selectedImageType;
    setSelectedImage(null);
    setSelectedImageType("");
    setIsLoading(true);

    try {
      const botResponse = await generateResponse(userMessage.text, imageToSend || undefined, imageTypeToSend || undefined);

      // Clean markdown formatting (remove ** for bold)
      const cleanedResponse = botResponse.replace(/\*\*/g, '');

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanedResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Optional: Read response aloud
      if (window.speechSynthesis) {
        speakText(cleanedResponse);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize for the technical difficulty. Please try asking your question again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.error("Speech recognition error:", event.error);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };

  const downloadPDF = () => {
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(255, 107, 157); // Pink color
    pdf.text("Smart Shopping Assistant Chat", 20, yPosition);

    yPosition += 15;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Customer: ${currentUser?.name || "N/A"}`, 20, yPosition);
    pdf.text(`Email: ${currentUser?.email || "N/A"}`, 20, yPosition + 7);
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition + 14);

    yPosition += 25;

    // Separator
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(255, 107, 157);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    messages.forEach((message, index) => {
      const sender = message.sender === "user" ? "You" : "Shopping Assistant";
      const time = message.timestamp.toLocaleTimeString();

      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(10);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`${sender} - ${time}`, 20, yPosition);

      yPosition += 10;

      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);

      const splitText = pdf.splitTextToSize(message.text, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);

      yPosition += splitText.length * 5 + 10;
    });

    const filename = `shopping-assistant-chat-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);
  };

  const goBack = () => {
    if (messages.length > 1) {
      setShowClosingRemarks(true);
    } else {
      window.location.href = "/dashboard/user";
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setSelectedImageType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setSelectedImageType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirmExit = () => {
    setShowClosingRemarks(false);
    window.location.href = "/dashboard/user";
  };

  const cancelExit = () => {
    setShowClosingRemarks(false);
  };

  const quickActions = [
    {
      text: "How do I find the right size for clothing items?",
      label: "Sizing Guide",
      icon: <Ruler className="w-4 h-4" />,
    },
    {
      text: "What are the delivery options and estimated shipping times?",
      label: "Delivery Info",
      icon: <Truck className="w-4 h-4" />,
    },
    {
      text: "What is your return and exchange policy?",
      label: "Returns Policy",
      icon: <RotateCcw className="w-4 h-4" />,
    },
    {
      text: "Can you recommend products based on my style preferences?",
      label: "Product Recommendations",
      icon: <Shirt className="w-4 h-4" />,
    },
  ];

  return (
    <>
      <Head>
        <title>Shopping Assistant - Smart Online Shopping</title>
        <meta
          name="description"
          content="Get instant answers about sizing, delivery, returns, and product recommendations"
        />
      </Head>

      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <button onClick={goBack} className={styles.backButton}>
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className={styles.headerCenter}>
              <div className={styles.logo}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className={styles.headerText}>
                <h1>Shopping Assistant</h1>
                <p>
                  {currentUser?.name ? `Hi ${currentUser.name}! ` : ""}Ask me anything about shopping
                </p>
              </div>
            </div>
            <button onClick={downloadPDF} className={styles.downloadBtn} title="Download chat">
              <Download className="w-5 h-5" />
              <span>Download</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.chatContainer}>
            {/* Messages */}
            <div className={styles.messagesContainer}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`${styles.messageWrapper} ${
                    message.sender === "user" ? styles.userMessage : styles.botMessage
                  }`}
                >
                  <div className={styles.messageBubble}>
                    {message.image && (
                      <img
                        src={message.image}
                        alt="Uploaded"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "300px",
                          borderRadius: "12px",
                          marginBottom: "0.75rem",
                          objectFit: "contain",
                        }}
                      />
                    )}
                    <p className={styles.messageText}>{message.text}</p>
                    <p className={styles.messageTime}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.botMessage}`}>
                  <div className={styles.messageBubble}>
                    <div className={styles.typingIndicator}>
                      <div className={styles.typingDots}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
              {selectedImage && (
                <div style={{
                  padding: "1rem",
                  background: "#FFF5F7",
                  borderRadius: "12px 12px 0 0",
                  borderBottom: "2px solid #FFE5EE",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <img
                    src={selectedImage}
                    alt="Preview"
                    style={{
                      maxWidth: "100px",
                      maxHeight: "100px",
                      borderRadius: "8px",
                      objectFit: "contain",
                      border: "2px solid #FF6B9D"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#C44569", fontSize: "0.9rem" }}>
                      📷 Image ready for analysis
                    </p>
                    <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#95A5A6" }}>
                      Add a message or send the image directly
                    </p>
                  </div>
                  <button
                    onClick={removeImage}
                    style={{
                      background: "#FF6B9D",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className={styles.inputWrapper}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !!selectedImage}
                  className={styles.voiceBtn}
                  style={{ marginRight: "0.5rem" }}
                  title="Upload fashion image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !isLoading && handleSendMessage()
                  }
                  placeholder="Ask about sizing, delivery, returns, products, or upload an image..."
                  className={styles.messageInput}
                  disabled={isLoading}
                />

                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className={styles.stopSpeakBtn}
                    title="Stop reading"
                  >
                    <VolumeX className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={startListening}
                  disabled={isListening || isLoading}
                  className={`${styles.voiceBtn} ${isListening ? styles.listening : ""}`}
                  title={isListening ? "Listening..." : "Voice input"}
                >
                  <Mic className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !selectedImage) || isLoading}
                  className={styles.sendBtn}
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.footerText}>
                <p>Powered by AI • Instant answers for your shopping questions</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action.text)}
                className={styles.quickActionBtn}
                disabled={isLoading}
              >
                <div className={styles.quickActionIcon}>{action.icon}</div>
                <div className={styles.quickActionLabel}>{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Closing Remarks Modal */}
        {showClosingRemarks && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
              padding: "1rem"
            }}
            onClick={cancelExit}
          >
            <div
              style={{
                background: "white",
                borderRadius: "20px",
                padding: "2.5rem",
                maxWidth: "500px",
                width: "100%",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
                textAlign: "center"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: "2.5rem"
              }}>
                👋
              </div>

              <h2 style={{
                fontSize: "1.8rem",
                marginBottom: "1rem",
                color: "#2c3e50",
                fontWeight: 700
              }}>
                Thank You for Shopping with Us!
              </h2>

              <p style={{
                fontSize: "1rem",
                color: "#636E72",
                marginBottom: "1.5rem",
                lineHeight: "1.6"
              }}>
                {currentUser?.name ? `${currentUser.name}, it` : "It"} was a pleasure assisting you today!
                We hope you found what you were looking for. Feel free to come back anytime for more fashion advice and recommendations.
              </p>

              <div style={{
                background: "linear-gradient(135deg, #FFF5F7 0%, #FFE5EE 100%)",
                padding: "1.5rem",
                borderRadius: "12px",
                marginBottom: "1.5rem"
              }}>
                <p style={{
                  fontSize: "0.95rem",
                  color: "#C44569",
                  fontWeight: 600,
                  margin: 0,
                  lineHeight: "1.5"
                }}>
                  💡 Remember: You can always download your chat history for reference,
                  and don't forget to check out our virtual try-on feature!
                </p>
              </div>

              <div style={{
                display: "flex",
                gap: "1rem",
                marginTop: "1.5rem"
              }}>
                <button
                  onClick={cancelExit}
                  style={{
                    flex: 1,
                    padding: "0.875rem 1.5rem",
                    background: "#E8EAF6",
                    color: "#667eea",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#C5CAE9";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "#E8EAF6";
                  }}
                >
                  Continue Chat
                </button>
                <button
                  onClick={confirmExit}
                  style={{
                    flex: 1,
                    padding: "0.875rem 1.5rem",
                    background: "linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow: "0 4px 12px rgba(255, 107, 157, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 107, 157, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 107, 157, 0.3)";
                  }}
                >
                  Exit to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
