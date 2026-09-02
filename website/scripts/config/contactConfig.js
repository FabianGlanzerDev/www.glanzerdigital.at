'use strict';

window.GlanzerContactConfig = Object.freeze({
  whatsappNumber: '436767875304',
  contactEmail: 'fabsdev@gmx.at',
  maxMessageLength: 1200,
  requiredFields: ['name', 'projectStatus', 'timeframe', 'message', 'privacy'],
  text: Object.freeze({
    nameMissing: 'Bitte gib deinen Namen ein.',
    nameShort: 'Der Name ist zu kurz.',
    statusMissing: 'Bitte wähle den Projektstand aus.',
    timeframeMissing: 'Bitte wähle einen ungefähren Zeitraum aus.',
    messageMissing: 'Bitte beschreibe dein Projekt kurz.',
    messageShort: 'Bitte gib etwas mehr Details an (mindestens 20 Zeichen).',
    privacyMissing: 'Bitte bestätige die Datenschutzerklärung.',
    invalid: 'Bitte prüfe die markierten Angaben.',
    whatsappOpened: 'WhatsApp wurde mit deiner vorbereiteten Nachricht geöffnet.',
    webmailOpened: 'Dein Webmail-Anbieter wurde mit der vorbereiteten Nachricht geöffnet.',
    mailAppOpened: 'Deine Mail-App wurde mit der vorbereiteten Nachricht geöffnet.',
    copied: 'E-Mail-Daten wurden kopiert. Füge sie in deinem E-Mail-Postfach ein.',
    copyFailed: 'Die E-Mail-Daten konnten nicht kopiert werden.',
    gmxOpened: 'E-Mail-Daten wurden kopiert und GMX wurde geöffnet.',
    greeting: 'Hallo, ich möchte ein Projekt bei GlanzerDigital anfragen.',
  }),
});
