'use strict';

window.GlanzerContactConfig = Object.freeze({
  whatsappNumber: '436767875304',
  emailEndpoint: '/api/contact-mail.php',
  maxMessageLength: 1200,
  requiredFields: ['name', 'projectStatus', 'timeframe', 'message', 'privacy'],
  text: Object.freeze({
    nameMissing: 'Bitte gib deinen Namen ein.',
    nameShort: 'Der Name ist zu kurz.',
    statusMissing: 'Bitte wähle den Projektstand aus.',
    timeframeMissing: 'Bitte wähle einen ungefähren Zeitraum aus.',
    messageMissing: 'Bitte beschreibe dein Projekt kurz.',
    emailMissing: 'Bitte gib deine E-Mail-Adresse ein.',
    emailInvalid: 'Bitte gib eine gültige E-Mail-Adresse ein.',
    messageShort: 'Bitte gib etwas mehr Details an (mindestens 20 Zeichen).',
    privacyMissing: 'Bitte bestätige die Datenschutzerklärung.',
    invalid: 'Bitte prüfe die markierten Angaben.',
    whatsappOpened: 'WhatsApp wurde mit deiner vorbereiteten Nachricht geöffnet.',
    emailSent: 'Deine Anfrage wurde erfolgreich per E-Mail gesendet. Ich melde mich so bald wie möglich bei dir.',
    emailFailed: 'Die E-Mail konnte gerade nicht gesendet werden. Bitte versuche es erneut oder nutze WhatsApp.',
    greeting: 'Hallo, ich möchte ein Projekt bei GlanzerDigital anfragen.',
  }),
});
