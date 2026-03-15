const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, body) {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL SKIPPED]', { to, subject });
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"E-Cell IIT Bombay" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
    });
  } catch (err) {
    console.error('Email error:', err);
  }
}

async function notifyAdminNewQuery(adminEmail, studentName, queryTitle) {
  await sendEmail(
    adminEmail,
    'New Query Submitted - E-Cell Portal',
    `Student ${studentName} has submitted a new query: ${queryTitle}. Please review and assign.`
  );
}

async function notifyCoordinatorAssigned(coordinatorEmail, queryTitle) {
  await sendEmail(
    coordinatorEmail,
    'New Query Assigned - E-Cell Portal',
    `A new query has been assigned to you by Admin. Query: ${queryTitle}. Please login to view details.`
  );
}

async function notifyStudentCoordinatorAssigned(studentEmail, queryTitle) {
  await sendEmail(
    studentEmail,
    'Coordinator Assigned - E-Cell Portal',
    `Your query ${queryTitle} has been assigned to a coordinator. They will contact you soon.`
  );
}

async function notifyStudentQueryResolved(studentEmail, queryTitle, solution) {
  await sendEmail(
    studentEmail,
    'Query Resolved - E-Cell Portal',
    `Your query ${queryTitle} has been resolved. Solution: ${solution || 'Check portal for details'}`
  );
}

module.exports = {
  notifyAdminNewQuery,
  notifyCoordinatorAssigned,
  notifyStudentCoordinatorAssigned,
  notifyStudentQueryResolved,
};
