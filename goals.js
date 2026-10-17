// The four areas, in order of importance, with suggested goals people can add.
// "starter: true" goals are on everyone's list the first time they open the app.
window.AREAS = [
  {
    id: "spiritual",
    name: "Spiritual",
    tagline: "The one that holds the rest together.",
    why: "Everything else on this list is good. This one matters most. Spend time with God every day, keep a verse in your head and stay in a group that asks how it’s really going.",
    verse: { text: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.", ref: "Matthew 6:33" },
    goals: [
      { id: "sp-read", label: "Read today’s passage", detail: "The Spiritual Workout Plan reading for the day.", starter: true },
      { id: "sp-pray", label: "Pray for 5 minutes", detail: "Any time of day. Talk to God about what’s actually going on.", starter: true },
      { id: "sp-verse", label: "Work on the memory verse", detail: "Say this week’s verse out loud a few times." },
      { id: "sp-pray-group", label: "Pray for someone in my group", detail: "One person by name. Text them that you did." },
      { id: "sp-quiet", label: "5 minutes of quiet with God", detail: "No music, no phone." },
      { id: "sp-serve", label: "Serve someone", detail: "One act of kindness nobody asked for." }
    ]
  },
  {
    id: "physical",
    name: "Physical",
    tagline: "Take care of the body God gave you.",
    why: "A tired, run-down body makes everything harder, including following Jesus. Sleep, move, eat real food and get outside.",
    verse: { text: "For you were bought with a price. So glorify God in your body.", ref: "1 Corinthians 6:20" },
    goals: [
      { id: "ph-bedtime", label: "Consistent bedtime", detail: "Same time most nights.", starter: true },
      { id: "ph-sleep", label: "7+ hours of sleep", detail: "What most adults need (CDC)." },
      { id: "ph-exercise", label: "30 minutes of exercise", detail: "Lift, run, play, anything that gets your heart rate up.", starter: true },
      { id: "ph-water", label: "Drink enough water", detail: "Carry a bottle and refill it between classes." },
      { id: "ph-produce", label: "Fruit or veggie at every meal", detail: "Add one to every plate." },
      { id: "ph-outside", label: "Get outside", detail: "At least 20 minutes outdoors." }
    ]
  },
  {
    id: "mental",
    name: "Mental",
    tagline: "Guard your attention. Plan your days.",
    why: "Your mind gets trained every day by what you watch and scroll. Be picky about what gets in, and plan your days so school doesn’t run you.",
    verse: { text: "Do not be conformed to this world, but be transformed by the renewal of your mind.", ref: "Romans 12:2" },
    goals: [
      { id: "me-screen", label: "Stay under my screen-time limit", detail: "Set a daily limit for social apps and let your phone enforce it.", starter: true },
      { id: "me-plan", label: "Plan tomorrow tonight", detail: "What’s due, where you need to be, your top three tasks." },
      { id: "me-focus", label: "Notifications off while studying", detail: "Check messages on breaks." },
      { id: "me-early", label: "Start assignments early", detail: "Do the first 20 minutes the day you get it." },
      { id: "me-journal", label: "Journal for 5 minutes", detail: "What happened, what you’re thinking, what you’re thankful for." }
    ]
  },
  {
    id: "emotional",
    name: "Emotional",
    tagline: "Notice what’s good. Stay close to your people.",
    why: "You need beauty you actually notice and people who actually know you. Neither one happens by accident.",
    verse: { text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together.", ref: "Hebrews 10:24–25" },
    goals: [
      { id: "em-meal", label: "Share a meal with someone", detail: "Eat with someone instead of alone.", starter: true },
      { id: "em-good", label: "Write down one good thing", detail: "One good thing from your day, before bed." },
      { id: "em-reach", label: "Reach out to someone", detail: "Call or text family or a friend you haven’t talked to in a while." },
      { id: "em-phones", label: "Phones down with people", detail: "When you’re with people, be with them." }
    ]
  }
];

// Weekly questions for connection group.
window.GROUP_QUESTIONS = [
  { q: "Spiritual", a: "How was your time with God this week? Did you do the reading and learn the verse?" },
  { q: "Into the light", a: "What sin or temptation do you need to bring into the light?" },
  { q: "Physical", a: "How did sleep, exercise and eating go?" },
  { q: "Mental", a: "Where did your time and attention go? Anything running you?" },
  { q: "Emotional", a: "What was good this week? What’s weighing on you?" },
  { q: "Integrity", a: "Have you been completely honest?" }
];
