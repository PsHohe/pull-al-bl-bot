const { countParticipants } = require("../utils/helpers");
const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const { classEmojis, roleEmojis } = require("../utils/constants");
const { CHANNEL_NAME } = require("../config");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client, userData) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, userData);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      const message = interaction.message;
      const embed = message.embeds[0];
      const fields = embed.fields;

      let participants =
        fields[0].value === "_Nadie se ha unido aún_"
          ? []
          : fields[0].value.split("\n");
      let absents =
        fields[4].value === "_Nadie ha confirmado ausencia_"
          ? []
          : fields[4].value.split("\n");

      const userId = interaction.user.id;
      const userMention = `<@${userId}>`;
      const userClassRole = userData[userId]
        ? `${classEmojis[userData[userId].class]}${roleEmojis[userData[userId].role]}`
        : "";

      // Check if the user has admin permissions
      const isAdmin = interaction.member.permissions.has(
        PermissionFlagsBits.Administrator,
      );

      if (
        interaction.customId === "lock" ||
        interaction.customId === "export"
      ) {
        if (!isAdmin) {
          await interaction.reply({
            content: "Solo los administradores pueden usar este botón.",
            ephemeral: true,
          });
          return;
        }
      }

      switch (interaction.customId) {
        case "join":
          if (!userData[userId]) {
            // User hasn't defined their character
            await interaction.reply({
              content:
                "Antes de unirte a la raid, debes definir tu personaje. Usa el comando `/definir-personaje` para hacerlo.",
              ephemeral: true,
            });
            return;
          }

          const userEntry = `${userMention} (${userData[userId]?.name || "Unknown"}) ${userClassRole}`;
          const userIndex = participants.findIndex((p) =>
            p.startsWith(userMention),
          );

          let replyContent;
          if (userIndex !== -1) {
            // User is already in the list, so remove them
            participants.splice(userIndex, 1);
            replyContent = "Has sido removido de la lista de participantes.";
          } else {
            // User is not in the list, so add them
            participants.push(userEntry);
            absents = absents.filter((user) => !user.includes(userMention));
            replyContent = "Has sido añadido a la lista de participantes.";
          }

          // First, update the embed
          await updateEmbed(interaction, embed, participants, absents);

          // Then, send the reply to the user
          await interaction.followUp({
            content: replyContent,
            ephemeral: true,
          });
          break;
        case "leave":
          // Create and show modal for absence reason
          const modal = new ModalBuilder()
            .setCustomId("absence-reason-modal")
            .setTitle("Razón de ausencia");

          const reasonInput = new TextInputBuilder()
            .setCustomId("absence-reason")
            .setLabel("¿Por qué no puedes asistir?")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const firstActionRow = new ActionRowBuilder().addComponents(
            reasonInput,
          );
          modal.addComponents(firstActionRow);

          await interaction.showModal(modal);
          break;
        case "lock":
          await lockRaid(interaction, embed);
          break;
        case "export":
          await exportRaidToCSV(interaction, embed, userData);
          break;
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "absence-reason-modal") {
        const reason = interaction.fields.getTextInputValue("absence-reason");
        const userId = interaction.user.id;
        const userMention = `<@${userId}>`;
        const userClassRole = userData[userId]
          ? `${classEmojis[userData[userId].class]}${roleEmojis[userData[userId].role]}`
          : "";

        // Update the raid message
        const message = interaction.message;
        const embed = message.embeds[0];
        const fields = embed.fields;

        let participants =
          fields[0].value === "_Nadie se ha unido aún_"
            ? []
            : fields[0].value.split("\n");
        let absents =
          fields[4].value === "_Nadie ha confirmado ausencia_"
            ? []
            : fields[4].value.split("\n");

        if (!absents.includes(userMention)) {
          const characterName = userData[userId]
            ? userData[userId].name
            : "Unknown";
          absents.push(`${userMention} (${characterName}) ${userClassRole}`);
          participants = participants.filter(
            (user) => !user.includes(userMention),
          );
        }

        await updateEmbed(interaction, embed, participants, absents);

        // Send message to officers channel
        const officersChannel = interaction.guild.channels.cache.find(
          (ch) => ch.name === CHANNEL_NAME,
        );
        if (officersChannel) {
          const userInfo = userData[userId] || {
            class: "Unknown",
            role: "Unknown",
          };
          await officersChannel.send(
            `**Ausencia Reportada**\n` +
              `Usuario: ${userMention}\n` +
              `Clase: ${userInfo.class}\n` +
              `Rol: ${userInfo.role}\n` +
              `Razón: ${reason}`,
          );
        }

        await interaction.followUp({
          content:
            "Tu ausencia ha sido registrada y notificada a los oficiales.",
          ephemeral: true,
        });
      }
    }
  },
};

async function updateEmbed(interaction, embed, participants, absents) {
  const counts = countParticipants(participants);

  const classBreakdown = Object.entries(counts.classes)
    .map(
      ([className, count]) =>
        `${classEmojis[className]} ${className.charAt(0).toUpperCase() + className.slice(1)}: ${count}`,
    )
    .join("\n");

  const roleBreakdown = Object.entries(roleEmojis)
    .map(([roleName, emoji]) => {
      const count = counts.roles[roleName] || 0;
      let warning = "";

      if (roleName === "tank" && count < 2) {
        warning = " ⚠️";
      } else if (roleName === "healer" && count < Math.ceil(counts.total / 5)) {
        warning = " ⚠️";
      }

      return `${emoji} ${roleName.charAt(0).toUpperCase() + roleName.slice(1)}: ${count}${warning}`;
    })
    .join("\n");

  const summaryValue = `**Total:** ${counts.total}\n\n**Clases:**\n${classBreakdown || "N/A"}\n\n**Roles:**\n${roleBreakdown}`;

  const updatedEmbed = EmbedBuilder.from(embed).setFields(
    {
      name: "👥 Participantes",
      value:
        participants.length > 0
          ? participants.join("\n")
          : "_Nadie se ha unido aún_",
      inline: false,
    },
    { name: "\u200B", value: "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔", inline: false },
    { name: "📊 Resumen", value: summaryValue, inline: false },
    { name: "\u200B", value: "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔", inline: false },
    {
      name: "🚫 Ausentes",
      value:
        absents.length > 0
          ? absents.join("\n")
          : "_Nadie ha confirmado ausencia_",
      inline: false,
    },
  );

  await interaction.update({ embeds: [updatedEmbed] });
}

async function lockRaid(interaction, embed) {
  const lockedEmbed = EmbedBuilder.from(embed)
    .setColor("#FF0000")
    .setFooter({ text: "Esta raid ha sido bloqueada por un administrador." });

  const lockedRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("join")
      .setLabel("Unirse")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("✅")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("leave")
      .setLabel("Ausentarse")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("❌")
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("export")
      .setLabel("Exportar CSV")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji("📊"),
  );

  await interaction.update({ embeds: [lockedEmbed], components: [lockedRow] });
}

async function exportRaidToCSV(interaction, embed, userData) {
  // Extract raid information
  const raidName = embed.title.split("**")[1];
  const [date, time] = embed.description
    .split("\n")
    .map((line) => line.split("`")[1]);

  // Extract participants and absents
  const participants = embed.fields[0].value
    .split("\n")
    .filter((p) => p !== "_Nadie se ha unido aún_");
  const absents = embed.fields[4].value
    .split("\n")
    .filter((p) => p !== "_Nadie ha confirmado ausencia_");

  // Create CSV content
  let csvContent = "Nombre,Clase,Rol,Estado\n";

  // Function to process user data
  const processUser = (userMention, status) => {
    const [mention, nameAndEmojis] = userMention.split(" (");
    const [characterName, classRoleEmojis] = nameAndEmojis.split(") ");
    const userId = mention.replace("<@", "").replace(">", "");
    const user = userData[userId];

    if (user) {
      return `${user.name},${user.class},${user.role},${status}\n`;
    } else {
      const className =
        Object.keys(classEmojis).find(
          (key) => classEmojis[key] === classRoleEmojis[0],
        ) || "Unknown";
      const roleName =
        Object.keys(roleEmojis).find(
          (key) => roleEmojis[key] === classRoleEmojis[1],
        ) || "Unknown";
      return `${characterName},${className},${roleName},${status}\n`;
    }
  };

  // Process participants
  participants.forEach((participant) => {
    csvContent += processUser(participant, "Presente");
  });

  // Process absents
  absents.forEach((absent) => {
    csvContent += processUser(absent, "Ausente");
  });

  // Create and send the CSV file
  const buffer = Buffer.from(csvContent, "utf-8");
  await interaction.reply({
    content: `Exportación de la raid "${raidName}" (${date} ${time})`,
    files: [
      {
        attachment: buffer,
        name: `raid_${raidName.replace(/\s+/g, "_")}_${date.replace(/\//g, "-")}.csv`,
      },
    ],
    ephemeral: true,
  });
}
