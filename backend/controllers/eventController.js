const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');

// ─── Supervisor / Admin ───

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, date, endDate, location, isNational, pointsReward, badge, maxParticipants } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date are required' });

    const points = Number.isFinite(Number(pointsReward)) ? Number(pointsReward) : 10;
    const max = Number.isFinite(Number(maxParticipants)) ? Number(maxParticipants) : 0;
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';

    const event = await Event.create({
      title: title.trim(),
      description: trimmedDescription,
      type,
      date,
      endDate,
      location: location || 'Online',
      isNational: !!isNational,
      pointsReward: Math.max(0, points),
      badge: badge || '',
      maxParticipants: Math.max(0, max),
      createdBy: req.user._id,
      status: new Date(date) <= new Date() ? 'ongoing' : 'upcoming'
    });

    res.status(201).json(event);
  } catch (err) {
    console.error('createEvent error:', err);
    if (err?.name === 'ValidationError') {
      const firstMessage = Object.values(err.errors || {})[0]?.message || 'Invalid event data';
      return res.status(400).json({ error: firstMessage });
    }
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    await EventParticipation.deleteMany({ eventId: req.params.id });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Get participants for an event
exports.getEventParticipants = async (req, res) => {
  try {
    const participants = await EventParticipation.find({ eventId: req.params.id })
      .populate('patientId', 'firstName lastName name email')
      .sort({ registeredAt: -1 });
    res.json(participants);
  } catch (err) {
    console.error('getEventParticipants error:', err);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
};

// Mark participant as attended
exports.markAttended = async (req, res) => {
  try {
    const participation = await EventParticipation.findById(req.params.participationId);
    if (!participation) return res.status(404).json({ error: 'Participation not found' });

    const event = await Event.findById(participation.eventId);
    participation.status = 'attended';
    participation.attendedAt = new Date();
    participation.pointsEarned = event ? event.pointsReward : 10;
    participation.badgeEarned = event ? event.badge : '';
    await participation.save();

    res.json(participation);
  } catch (err) {
    console.error('markAttended error:', err);
    res.status(500).json({ error: 'Failed to mark attended' });
  }
};

// ─── Shared ───

// Get all events (with optional filters)
exports.getAllEvents = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    // Auto-update statuses based on current date
    const now = new Date();
    await Event.updateMany(
      { status: 'upcoming', date: { $lte: now } },
      { $set: { status: 'ongoing' } }
    );
    await Event.updateMany(
      { status: 'ongoing', endDate: { $lte: now } },
      { $set: { status: 'completed' } }
    );

    const events = await Event.find(filter).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    console.error('getAllEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// ─── Patient ───

// Join / register for an event
exports.joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status === 'cancelled') return res.status(400).json({ error: 'Event is cancelled' });
    if (event.status === 'completed') return res.status(400).json({ error: 'Event has ended' });

    // Check max participants
    if (event.maxParticipants > 0) {
      const count = await EventParticipation.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } });
      if (count >= event.maxParticipants) return res.status(400).json({ error: 'Event is full' });
    }

    // Check if already registered
    const existing = await EventParticipation.findOne({ eventId: event._id, patientId: req.user._id });
    if (existing) {
      if (existing.status === 'cancelled') {
        existing.status = 'registered';
        existing.registeredAt = new Date();
        await existing.save();
        return res.json(existing);
      }
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    const participation = await EventParticipation.create({
      eventId: event._id,
      patientId: req.user._id
    });

    res.status(201).json(participation);
  } catch (err) {
    console.error('joinEvent error:', err);
    res.status(500).json({ error: 'Failed to join event' });
  }
};

// Cancel registration
exports.cancelRegistration = async (req, res) => {
  try {
    const participation = await EventParticipation.findOne({
      eventId: req.params.id,
      patientId: req.user._id
    });
    if (!participation) return res.status(404).json({ error: 'Not registered for this event' });

    participation.status = 'cancelled';
    await participation.save();
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    console.error('cancelRegistration error:', err);
    res.status(500).json({ error: 'Failed to cancel registration' });
  }
};

// Get my events & participation
exports.getMyEvents = async (req, res) => {
  try {
    const participations = await EventParticipation.find({ patientId: req.user._id, status: { $ne: 'cancelled' } })
      .populate('eventId')
      .sort({ registeredAt: -1 });

    res.json(participations);
  } catch (err) {
    console.error('getMyEvents error:', err);
    res.status(500).json({ error: 'Failed to fetch your events' });
  }
};

// Get my total points & badges
exports.getMyRewards = async (req, res) => {
  try {
    const participations = await EventParticipation.find({
      patientId: req.user._id,
      status: 'attended'
    });

    const totalPoints = participations.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
    const badges = participations.filter(p => p.badgeEarned).map(p => p.badgeEarned);

    res.json({ totalPoints, badges, eventsAttended: participations.length });
  } catch (err) {
    console.error('getMyRewards error:', err);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
};
