const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const { RAIDS_CHANNEL_NAME } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crear-raid")
    .setDescription("Crea una nueva raid")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de la raid")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("fecha")
        .setDescription("Fecha de la raid (DD/MM/YYYY)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("hora")
        .setDescription("Hora de la raid (HH:MM)")
        .setRequired(true),
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      await interaction.reply({
        content: "Solo los administradores pueden usar este comando.",
        ephemeral: true,
      });
      return;
    }

    const name = interaction.options.getString("nombre");
    const date = interaction.options.getString("fecha");
    const time = interaction.options.getString("hora");

    const raidEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`🗡️ Raid: **${name}**`)
      .setDescription(`📅 Fecha: \`${date}\`\n⏰ Hora: \`${time}\``)
      .addFields(
        {
          name: "👥 Participantes",
          value: "_Nadie se ha unido aún_",
          inline: false,
        },
        { name: "\u200B", value: "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔", inline: false },
        {
          name: "📊 Resumen",
          value: "**Total:** 0\n**Clases:** N/A\n**Roles:** N/A",
          inline: false,
        },
        { name: "\u200B", value: "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔", inline: false },
        {
          name: "🚫 Ausentes",
          value: "_Nadie ha confirmado ausencia_",
          inline: false,
        },
      )
      .setFooter({ text: "¡Únete a la raid o confirma tu ausencia!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("join")
        .setLabel("Unirse")
        .setStyle(ButtonStyle.Success)
        .setEmoji("✅"),
      new ButtonBuilder()
        .setCustomId("leave")
        .setLabel("Ausentarse")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("😞"),
      new ButtonBuilder()
        .setCustomId("lock")
        .setLabel("Bloquear")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🔒"),
      new ButtonBuilder()
        .setCustomId("export")
        .setLabel("Exportar CSV")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("📊"),
    );

    const channel = interaction.guild.channels.cache.find(
      (ch) => ch.name === RAIDS_CHANNEL_NAME,
    );
    if (!channel) {
      await interaction.reply("No se encontró el canal de raids.");
      return;
    }

    await channel.send({ embeds: [raidEmbed], components: [row] });
    await interaction.reply(`Raid creada en ${channel}`);
  },
};
