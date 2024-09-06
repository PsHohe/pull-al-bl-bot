const { SlashCommandBuilder } = require("@discordjs/builders");
const { classEmojis, roleEmojis } = require("../utils/constants");
const { saveUserData } = require("../utils/userDataManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("definir-personaje")
    .setDescription("Define tu personaje, clase y rol")
    .addStringOption((option) =>
      option
        .setName("nombre")
        .setDescription("Nombre de tu personaje")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("clase")
        .setDescription("Tu clase en WoW")
        .setRequired(true)
        .addChoices(
          ...Object.keys(classEmojis).map((c) => ({
            name: c.charAt(0).toUpperCase() + c.slice(1),
            value: c,
          })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("rol")
        .setDescription("Tu rol en las raids")
        .setRequired(true)
        .addChoices(
          ...Object.keys(roleEmojis).map((r) => ({
            name: r.charAt(0).toUpperCase() + r.slice(1),
            value: r,
          })),
        ),
    ),
  async execute(interaction, userData) {
    const userId = interaction.user.id;
    const characterName = interaction.options.getString("nombre");
    const className = interaction.options.getString("clase");
    const roleName = interaction.options.getString("rol");

    userData[userId] = {
      name: characterName,
      class: className,
      role: roleName,
    };
    saveUserData(userData);

    await interaction.reply({
      content: `Tu personaje ha sido definido como ${characterName}, ${className} ${roleName}.`,
      ephemeral: true,
    });
  },
};
