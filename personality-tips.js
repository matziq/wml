const profiles = {
  spark: {
    mark: "S",
    name: "The Spark",
    tagline: "You make the first move.",
    strength: "Your enthusiasm lowers the barrier for everyone else. Keep your invitations warm, clear, and easy to decline.",
    challenge: "Practice slowing down long enough to listen. Courage is most powerful when it is paired with curiosity.",
    tips: [
      ["Use the 10-second invitation", "When a good thought comes, act before anxiety turns it into a committee meeting.", "“I’m going Sunday. Want to sit with me?”"],
      ["Offer one clear next step", "Skip the long explanation. Name the event, time, and what you will do together.", "“We’re serving at 10. I can pick you up at 9:45.”"],
      ["Ask, then listen", "After inviting, pause. Let the other person respond without filling the silence.", "“Would that interest you?”"],
      ["Make ‘no’ safe", "A relaxed response preserves trust and makes future conversations possible.", "“No worries at all—I’m glad I asked.”"],
      ["Bring a partner", "Your courage plus a thoughtful companion makes a strong team.", "“Will you come invite the Johnsons with me?”"],
      ["Notice the quieter person", "Use your confidence to include someone who might otherwise be overlooked.", "“Come join us. I’ll introduce you around.”"],
    ],
  },
  bridge: {
    mark: "B",
    name: "The Bridge",
    tagline: "You connect people through trust.",
    strength: "You notice people, remember what matters to them, and make invitations feel personal rather than promotional.",
    challenge: "Do not wait for a friendship to feel perfect. A sincere, timely invitation can deepen trust rather than threaten it.",
    tips: [
      ["Start with their world", "Ask about what matters to them before deciding what invitation might fit.", "“How has your family been doing lately?”"],
      ["Connect the invitation", "Explain why this particular experience made you think of them.", "“You mentioned wanting more community, and this came to mind.”"],
      ["Share a small why", "A brief personal reason feels more natural than a speech.", "“Church has helped me feel less alone this year.”"],
      ["Use ordinary moments", "Walks, meals, carpools, and texts often create better conversations than formal settings.", "“Can I tell you something that helped me this week?”"],
      ["Follow up as a friend", "After any invitation, ask about their life—not just their answer.", "“How did that appointment go?”"],
      ["Set a gentle deadline", "Choose one person and one day so relationship-building does not become endless waiting.", "“I’m going to text Maya before Friday.”"],
    ],
  },
  beacon: {
    mark: "L",
    name: "The Beacon",
    tagline: "You create a safe place to belong.",
    strength: "Your steady example and practical service help people experience the gospel before they have words for it.",
    challenge: "Do not make others guess why you serve. A simple sentence about your faith can turn a good deed into a meaningful witness.",
    tips: [
      ["Name your motivation", "Add one honest sentence that connects your service to what you believe.", "“My faith teaches me that nobody should carry this alone.”"],
      ["Be the welcome plan", "Meet an invited guest at the door, sit with them, and explain what happens next.", "“I’ll wait outside and we can walk in together.”"],
      ["Support someone else’s invitation", "Offer the ride, meal, introduction, or follow-up that helps another person be brave.", "“You invite them; I’ll make sure they feel at home.”"],
      ["Share what sustains you", "When someone notices your steadiness, tell them where it comes from.", "“Prayer has been helping me take this one day at a time.”"],
      ["Serve side by side", "Invite someone into meaningful service before inviting them into a meeting.", "“Would you help us pack these kits Saturday?”"],
      ["Let consistency do its work", "Small, repeated kindness creates credibility. Keep showing up without measuring every result.", "“I was thinking about you—how can I help this week?”"],
    ],
  },
  seed: {
    mark: "Q",
    name: "The Seed",
    tagline: "You take quiet, sincere steps.",
    strength: "You choose words carefully and respect other people’s space. Your invitations can feel especially safe and genuine.",
    challenge: "Fear shrinks when the next step is specific and tiny. Success means acting with love—not controlling the response.",
    tips: [
      ["Use a prepared sentence", "Decide your exact words before the moment arrives. You do not have to improvise.", "“No pressure, but I’d love to have you come with me.”"],
      ["Choose the smallest brave step", "React to a post, send a link, mention church, or ask one gentle question.", "“Would it be okay if I sent you something that helped me?”"],
      ["Invite by text", "Written invitations are real invitations. Keep them personal, brief, and easy to decline.", "“I’m going to this Sunday and thought of you. Interested?”"],
      ["Borrow courage", "Ask a friend or missionary to help you send the message or make the invitation together.", "“Could you sit with me while I text Alex?”"],
      ["Practice out loud", "Say your invitation three times before using it. Familiar words feel less frightening.", "“I’m practicing being brave—would you like to come?”"],
      ["Count the attempt", "Your job is to offer love and choice. A yes is wonderful; a kind invitation is already success.", "“Thanks for hearing me. Our friendship matters either way.”"],
    ],
  },
};

const type = document.body.dataset.type;
const profile = profiles[type];

if (profile) {
  document.title = `${profile.name} Tips | Missionary Styles`;
  document.querySelector("#profile-mark").textContent = profile.mark;
  document.querySelector("#profile-name").textContent = profile.name;
  document.querySelector("#profile-tagline").textContent = profile.tagline;
  document.querySelector("#profile-strength").textContent = profile.strength;
  document.querySelector("#profile-challenge").textContent = profile.challenge;

  const tipGrid = document.querySelector("#tip-grid");
  profile.tips.forEach(([title, text, phrase], index) => {
    const article = document.createElement("article");
    article.className = "tip-card";

    const number = document.createElement("span");
    number.className = "tip-number";
    number.textContent = String(index + 1);

    const heading = document.createElement("h3");
    heading.textContent = title;

    const description = document.createElement("p");
    description.textContent = text;

    const sayThis = document.createElement("p");
    sayThis.className = "say-this";
    const label = document.createElement("strong");
    label.textContent = "Try saying: ";
    sayThis.append(label, document.createTextNode(phrase));

    article.append(number, heading, description, sayThis);
    tipGrid.append(article);
  });
}
