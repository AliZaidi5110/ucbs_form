import { jsPDF } from "jspdf";
import type { OnboardingFormData } from "./validations/onboarding";
import { formatDate } from "./utils";
import { DOCUMENT_TYPES } from "./constants";

type EmployeeRecord = {
  employeeId: string;
  fullName: string;
  department: string;
  designation: string;
  status: string;
  submittedAt: Date | null;
  formData: OnboardingFormData;
};

export function generateOnboardingPDF(employee: EmployeeRecord): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  let y = margin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;

  const addTitle = (text: string) => {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(text, margin, y);
    y += 8;
  };

  const addSection = (title: string) => {
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  const addField = (label: string, value: string) => {
    if (y > 280) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(value || "—", contentWidth - 50);
    doc.text(lines, margin + 50, y);
    y += Math.max(5, lines.length * 4.5);
  };

  addTitle("UCBS Employee Onboarding Pack");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${formatDate(new Date())}`, margin, y);
  y += 10;

  const { formData: d } = employee;

  addSection("Basic Details");
  addField("Employee ID:", d.basic.employeeId);
  addField("Full Name:", d.basic.fullName);
  addField("Department:", d.basic.department);
  addField("Designation:", d.basic.designation);
  addField("Reporting Manager:", d.basic.reportingManager || "—");
  addField("Date of Joining:", d.basic.dateOfJoining);
  addField("Work Location:", d.basic.workLocation);
  addField("Official Email:", d.basic.officialEmail);
  addField("Personal Email:", d.basic.personalEmail);
  addField("Mobile:", d.basic.mobileNumber);
  y += 4;

  addSection("Personal Details");
  addField("Date of Birth:", d.personal.dateOfBirth);
  addField("Gender:", d.personal.gender);
  addField("Marital Status:", d.personal.maritalStatus);
  addField("Blood Group:", d.personal.bloodGroup);
  addField("Nationality:", d.personal.nationality);
  addField("Current Address:", d.personal.currentAddress);
  addField("Permanent Address:", d.personal.permanentAddress);
  addField("Emergency Contact:", `${d.personal.emergencyContactName} (${d.personal.emergencyRelationship}) — ${d.personal.emergencyContactPhone}`);
  y += 4;

  addSection("Identification & Bank");
  addField("Aadhaar:", d.identification.aadhaarNumber.replace(/\d(?=\d{4})/g, "*"));
  addField("PAN:", d.identification.panNumber);
  addField("Bank:", d.identification.bankName);
  addField("Account:", d.identification.accountNumber.replace(/\d(?=\d{4})/g, "*"));
  addField("IFSC:", d.identification.ifscCode);
  y += 4;

  addSection("Education");
  d.education.entries.forEach((e, i) => {
    addField(`Entry ${i + 1}:`, `${e.qualification} — ${e.institution} (${e.year}) — ${e.percentage}`);
  });
  y += 4;

  addSection("Employment History");
  if (d.employment.isFresher) {
    addField("Status:", "Fresher");
  } else {
    d.employment.entries.forEach((e, i) => {
      addField(`Entry ${i + 1}:`, `${e.company} — ${e.designation} (${e.fromDate} to ${e.toDate})`);
    });
  }
  y += 4;

  addSection("Professional Summary");
  addField("Skills:", d.professional.keySkills.join(", "));
  addField("Experience:", d.professional.totalYearsExperience);
  addField("Achievements:", d.professional.majorAchievements || "—");
  y += 4;

  addSection("Documents Uploaded");
  d.documents.uploads.forEach((u) => {
    const label = DOCUMENT_TYPES.find((t) => t.key === u.documentType)?.label || u.documentType;
    addField(label + ":", u.fileName);
  });
  y += 4;

  addSection("Acknowledgements & Signatures");
  addField("Declaration:", d.acknowledgements.declarationSignature);
  addField("NDA:", d.acknowledgements.ndaSignature);
  addField("Code of Conduct:", d.acknowledgements.codeOfConductSignature);
  addField("Submitted:", formatDate(employee.submittedAt));

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateBulkCSV(
  rows: Array<{
    employeeId: string;
    fullName: string;
    department: string;
    designation: string;
    status: string;
    dateOfJoining: string;
    officialEmail: string;
    mobileNumber: string;
    submittedAt: string;
  }>
): string {
  const headers = [
    "Employee ID",
    "Full Name",
    "Department",
    "Designation",
    "Status",
    "Date of Joining",
    "Official Email",
    "Mobile",
    "Submitted At",
  ];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.employeeId,
        r.fullName,
        r.department,
        r.designation,
        r.status,
        r.dateOfJoining,
        r.officialEmail,
        r.mobileNumber,
        r.submittedAt,
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}
