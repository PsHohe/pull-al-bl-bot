const { classEmojis, roleEmojis } = require("./constants");

exports.countParticipants = (participants) => {
  const counts = {
    classes: {},
    roles: {},
    total: 0,
  };

  participants.forEach((participant) => {
    const parts = participant.split(" ");

    if (parts.length >= 3) {
      const lastPart = parts[parts.length - 1];

      for (const [className, classEmoji] of Object.entries(classEmojis)) {
        if (lastPart.includes(classEmoji)) {
          counts.classes[className] = (counts.classes[className] || 0) + 1;
          break;
        }
      }

      for (const [roleName, roleEmoji] of Object.entries(roleEmojis)) {
        if (lastPart.includes(roleEmoji)) {
          counts.roles[roleName] = (counts.roles[roleName] || 0) + 1;
          break;
        }
      }

      counts.total++;
    }
  });

  return counts;
};
