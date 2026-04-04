import Message from '../models/Message.js';
import User from '../models/User.js';

class ChatService {
  /**
   * Return list of contacts for a user.
   * Caregivers see Experts only. Experts see Caregivers only.
   */
  async getContacts(userId, role) {
    let contacts = [];

    if (role === 'caregiver') {
      // Caregiver sees only their approved experts
      const caregiver = await User.findById(userId)
        .populate('expertRequests.expertId', 'name email role')
        .lean();
      contacts = (caregiver?.expertRequests || [])
        .filter((r) => r.status === 'approved' && r.expertId)
        .map((r) => r.expertId);
    } else if (role === 'expert') {
      // Expert sees only caregivers that have an approved request for them
      contacts = await User.find({
        role: 'caregiver',
        expertRequests: { $elemMatch: { expertId: userId, status: 'approved' } },
      })
        .select('name email role')
        .lean();
    }

    // Attach last message + unread count for each contact
    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: userId, receiverId: contact._id },
            { senderId: contact._id, receiverId: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .lean();

        const unreadCount = await Message.countDocuments({
          senderId: contact._id,
          receiverId: userId,
          isRead: false,
        });

        return { ...contact, lastMessage, unreadCount };
      })
    );

    // Sort by last message time (most recent first)
    enriched.sort((a, b) => {
      const ta = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
      const tb = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
      return tb - ta;
    });

    return enriched;
  }

  /**
   * Return paginated messages between two users.
   */
  async getConversation(userA, userB, page = 1) {
    const limit = 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return messages.reverse();
  }

  /**
   * Persist a message to the database.
   */
  async saveMessage(data) {
    const message = await Message.create(data);
    return message.toObject();
  }

  /**
   * Mark all messages from sender to receiver as read.
   */
  async markAsRead(senderId, receiverId) {
    await Message.updateMany(
      { senderId, receiverId, isRead: false },
      { $set: { isRead: true } }
    );
  }
}

export default new ChatService();
