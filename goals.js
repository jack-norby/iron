// The four areas, in order of importance, with suggested goals people can add.
// "starter: true" goals are on everyone's list the first time they open the app.
window.AREAS = [
  {
    id: "spiritual",
    name: "Spiritual",
    tagline: "The one that holds the rest together.",
    why: "Everything else on this list is good. This one matters most. Spend time with God every day, keep a verse in your head and stay in a group that asks how it’s really going.",
    verse: { text: "But seek first the kingdom of God and his righteousness, and all these things will be added to you.", ref: "Matthew 6:33" },
    rest: "Stillness, worship and a weekly Sabbath. You don’t have to earn what God already gives.",
    app: { name: "Sing", note: "A worship devotional from The Worship Initiative. Start your time with God in worship.", url: "https://sing.theworshipinitiative.com/", cta: "Open Sing ↗" },
    goals: [
      { id: "sp-read", label: "Read today’s passage", detail: "The Spiritual Workout Plan reading for the day.", starter: true },
      { id: "sp-pray", label: "Pray for 5 minutes", detail: "Any time of day. Talk to God about what’s actually going on.", starter: true },
      { id: "sp-verse", label: "Work on the memory verse", detail: "Say this week’s verse out loud a few times." },
      { id: "sp-pray-group", label: "Pray for someone in my group", detail: "One person by name. Text them that you did." },
      { id: "sp-quiet", label: "5 minutes of quiet with God", detail: "No music, no phone. Just be with him.", rest: true },
      { id: "sp-worship", label: "Worship with Sing", detail: "Today’s worship devotional.", rest: true },
      { id: "sp-serve", label: "Serve someone", detail: "One act of kindness nobody asked for." }
    ]
  },
  {
    id: "physical",
    name: "Physical",
    tagline: "Take care of the body God gave you.",
    why: "A tired, run-down body makes everything harder, including following Jesus. Sleep, move, eat real food and get outside.",
    verse: { text: "For you were bought with a price. So glorify God in your body.", ref: "1 Corinthians 6:20" },
    rest: "Sleep, real breaks during the day and an easy day each week. Recovery is when you get stronger.",
    app: { name: "Ceko", note: "Lift with your gym: track workouts, lifts, runs and food with your friends. Made by a Salt Company leader.", url: "https://apps.apple.com/us/app/ceko-lift-with-your-gym/id6791621489" },
    goals: [
      { id: "ph-bedtime", label: "Consistent bedtime", detail: "Same time most nights.", starter: true, rest: true },
      { id: "ph-sleep", label: "7+ hours of sleep", detail: "What most adults need (CDC).", rest: true },
      { id: "ph-break", label: "Take real breaks", detail: "Every 90 minutes or so, get up: walk, stretch, refill your water.", rest: true },
      { id: "ph-exercise", label: "30 minutes of exercise", detail: "Lift, run, play, anything that gets your heart rate up.", starter: true },
      { id: "ph-log", label: "Log my workout or meals", detail: "Track it in Ceko so you can see your progress." },
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
    rest: "Time when school is done and the screen is off. Your mind needs to be off duty, not just distracted.",
    goals: [
      { id: "me-screen", label: "Stay under my screen-time limit", detail: "Set a daily limit for social apps and let your phone enforce it.", starter: true },
      { id: "me-plan", label: "Plan tomorrow tonight", detail: "What’s due, where you need to be, your top three tasks." },
      { id: "me-focus", label: "Notifications off while studying", detail: "Check messages on breaks." },
      { id: "me-early", label: "Start assignments early", detail: "Do the first 20 minutes the day you get it." },
      { id: "me-off", label: "Shut it down for the night", detail: "Pick a time when school and screens are done.", rest: true },
      { id: "me-journal", label: "Journal for 5 minutes", detail: "What happened, what you’re thinking, what you’re thankful for." }
    ]
  },
  {
    id: "emotional",
    name: "Emotional",
    tagline: "Notice what’s good. Stay close to your people.",
    why: "You need beauty you actually notice and people who actually know you. Neither one happens by accident.",
    verse: { text: "And let us consider how to stir up one another to love and good works, not neglecting to meet together.", ref: "Hebrews 10:24–25" },
    rest: "People and things that fill you back up, not just the ones that need something from you.",
    goals: [
      { id: "em-meal", label: "Share a meal with someone", detail: "Eat with someone instead of alone.", starter: true },
      { id: "em-good", label: "Write down one good thing", detail: "One good thing from your day, before bed." },
      { id: "em-fun", label: "Do something just for fun", detail: "Play, make, listen, create. Something that fills you back up.", rest: true },
      { id: "em-reach", label: "Reach out to someone", detail: "Call or text family or a friend you haven’t talked to in a while." },
      { id: "em-phones", label: "Phones down with people", detail: "When you’re with people, be with them." }
    ]
  }
];

// Weekly accountability questions, word for word from the Spiritual Workout Plan.
window.SWP_QUESTIONS = [
  { q: "Spiritual Disciplines", a: "Did you complete your Spiritual Workout Plan reading and memory this week?" },
  { q: "Sin & Temptation", a: "What sin or temptation do you need to bring into the light?" },
  { q: "Celebration & Stress", a: "What joy can you celebrate? What stress or burden do you need help carrying?" },
  { q: "Relationship Health", a: "Is there any brokenness in your core relationships that needs to be healed?" },
  { q: "Goals", a: "What sin do you want to kill or area of godliness do you want to grow in?" },
  { q: "Integrity Check", a: "Have you been completely honest?" }
];

// Extra questions for the other parts of Iron.
window.EXTRA_QUESTIONS = [
  { q: "Physical", a: "How did sleep, exercise and eating go this week?" },
  { q: "Mental", a: "Where did your time and attention go? Is anything running you?" },
  { q: "Emotional", a: "Who did you spend real time with? What’s weighing on you?" },
  { q: "Rest", a: "Did you take a Sabbath this week? Where did you push too hard, and what actually filled you back up?" },
  { q: "Repenter check", a: "Did you confess fast and full this week, or did you hide it, try to fix it alone or just talk about it?" },
  { q: "Sharing", a: "Who are you praying for by name? Did you get to share your story or the gospel with anyone?" }
];
