import { prisma } from "./prisma";
import { encryptIfPresent, decryptIfPresent } from "./encryption";
import type { OnboardingFormData } from "./validations/onboarding";
import { getDefaultFormValues, mergeDraftWithDefaults } from "./validations/onboarding";
import { Prisma } from "@prisma/client";
import type { Employee, EmployeeStatus } from "@prisma/client";

export async function getEmployeeByToken(token: string) {
  const onboardingToken = await prisma.onboardingToken.findFirst({
    where: {
      token,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    include: { employee: true },
  });
  return onboardingToken;
}

export async function loadFormDataForEmployee(employee: Employee): Promise<OnboardingFormData> {
  const defaults = getDefaultFormValues(employee);

  if (employee.draftData && employee.status !== "SUBMITTED" && employee.status !== "VERIFIED") {
    return mergeDraftWithDefaults(defaults, employee.draftData as Partial<OnboardingFormData>);
  }

  if (employee.status === "SUBMITTED" || employee.status === "VERIFIED") {
    const loaded = await loadSubmittedFormData(employee.id);
    if (loaded) return loaded;
  }

  return defaults;
}

async function loadSubmittedFormData(employeeId: string): Promise<OnboardingFormData | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      personalDetails: true,
      identificationDetails: true,
      bankDetails: true,
      education: { orderBy: { sortOrder: "asc" } },
      employmentHistory: { orderBy: { sortOrder: "asc" } },
      professionalSummary: true,
      itRequest: true,
      documentUploads: true,
      acknowledgement: true,
    },
  });

  if (!employee) return null;

  const defaults = getDefaultFormValues(employee);

  return {
    basic: {
      ...defaults.basic,
      fullName: employee.fullName,
      photographUrl: employee.photographUrl || "",
      personalEmail: employee.personalEmail || "",
      mobileNumber: employee.mobileNumber || "",
      alternateMobile: employee.alternateMobile || "",
    },
    personal: employee.personalDetails
      ? {
          dateOfBirth: employee.personalDetails.dateOfBirth?.toISOString().split("T")[0] || "",
          gender: employee.personalDetails.gender || "PREFER_NOT_TO_SAY",
          genderSelfDescribe: employee.personalDetails.genderSelfDescribe || "",
          maritalStatus: employee.personalDetails.maritalStatus || "SINGLE",
          bloodGroup: employee.personalDetails.bloodGroup || "",
          nationality: employee.personalDetails.nationality || "",
          currentAddress: employee.personalDetails.currentAddress || "",
          permanentAddress: employee.personalDetails.permanentAddress || "",
          sameAsCurrent: employee.personalDetails.sameAsCurrent,
          emergencyContactName: employee.personalDetails.emergencyContactName || "",
          emergencyContactPhone: employee.personalDetails.emergencyContactPhone || "",
          emergencyRelationship: employee.personalDetails.emergencyRelationship || "",
        }
      : defaults.personal,
    identification: {
      aadhaarNumber: decryptIfPresent(employee.identificationDetails?.aadhaarNumber) || "",
      panNumber: decryptIfPresent(employee.identificationDetails?.panNumber) || "",
      uan: employee.identificationDetails?.uan || "",
      esic: employee.identificationDetails?.esic || "",
      bankName: employee.bankDetails?.bankName || "",
      accountHolderName: employee.bankDetails?.accountHolderName || "",
      accountNumber: decryptIfPresent(employee.bankDetails?.accountNumber) || "",
      ifscCode: employee.bankDetails?.ifscCode || "",
      branch: employee.bankDetails?.branch || "",
    },
    education: {
      entries: employee.education.length
        ? employee.education.map((e) => ({
            qualification: e.qualification,
            institution: e.institution,
            year: e.year,
            percentage: e.percentage,
          }))
        : defaults.education.entries,
    },
    employment: {
      isFresher: employee.employmentHistory.length === 0,
      entries: employee.employmentHistory.map((e) => ({
        company: e.company,
        designation: e.designation,
        fromDate: e.fromDate,
        toDate: e.toDate,
        lastDrawnCtc: e.lastDrawnCtc || "",
        reasonForLeaving: e.reasonForLeaving || "",
      })),
    },
    professional: employee.professionalSummary
      ? {
          keySkills: (employee.professionalSummary.keySkills as string[]) || [],
          totalYearsExperience: employee.professionalSummary.totalYearsExperience || "",
          relevantIndustryExperience:
            employee.professionalSummary.relevantIndustryExperience || "",
          majorAchievements: employee.professionalSummary.majorAchievements || "",
        }
      : defaults.professional,
    it: employee.itRequest
      ? {
          laptopRequired: employee.itRequest.laptopRequired,
          officialEmailNeeded: employee.itRequest.officialEmailNeeded,
          simCardRequired: employee.itRequest.simCardRequired,
          accessRequired: (employee.itRequest.accessRequired as string[]) || [],
          accessOther: employee.itRequest.accessOther || "",
        }
      : defaults.it,
    documents: {
      uploads: employee.documentUploads.map((d) => ({
        documentType: d.documentType,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileKey: d.fileKey,
        mimeType: d.mimeType || undefined,
      })),
    },
    acknowledgements: employee.acknowledgement
      ? {
          understoodPolicies: employee.acknowledgement.understoodPolicies,
          maintainConfidentiality: employee.acknowledgement.maintainConfidentiality,
          agreeCompanyRules: employee.acknowledgement.agreeCompanyRules,
          understandAttendancePolicy: employee.acknowledgement.understandAttendancePolicy,
          receivedSafetyInfo: employee.acknowledgement.receivedSafetyInfo,
          agreeCodeOfConduct: employee.acknowledgement.agreeCodeOfConduct,
          acknowledgeNda: employee.acknowledgement.acknowledgeNda,
          agreeAssetHandling: employee.acknowledgement.agreeAssetHandling,
          declarationSignature: employee.acknowledgement.declarationSignature || "",
          ndaSignature: employee.acknowledgement.ndaSignature || "",
          codeOfConductSignature: employee.acknowledgement.codeOfConductSignature || "",
        }
      : defaults.acknowledgements,
  };
}

export async function saveDraft(employeeId: string, data: OnboardingFormData) {
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      draftData: data as unknown as Prisma.InputJsonValue,
      status: "IN_PROGRESS",
      fullName: data.basic.fullName,
      personalEmail: data.basic.personalEmail,
      mobileNumber: data.basic.mobileNumber,
      alternateMobile: data.basic.alternateMobile || null,
      photographUrl: data.basic.photographUrl || null,
    },
  });
}

export async function submitOnboarding(employeeId: string, data: OnboardingFormData) {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.employee.update({
      where: { id: employeeId },
      data: {
        fullName: data.basic.fullName,
        department: data.basic.department,
        designation: data.basic.designation,
        reportingManager: data.basic.reportingManager || null,
        dateOfJoining: new Date(data.basic.dateOfJoining),
        workLocation: data.basic.workLocation,
        personalEmail: data.basic.personalEmail,
        mobileNumber: data.basic.mobileNumber,
        alternateMobile: data.basic.alternateMobile || null,
        photographUrl: data.basic.photographUrl || null,
        status: "SUBMITTED",
        submittedAt: now,
        draftData: Prisma.JsonNull,
      },
    });

    await tx.personalDetails.upsert({
      where: { employeeId },
      create: {
        employeeId,
        dateOfBirth: new Date(data.personal.dateOfBirth),
        gender: data.personal.gender,
        genderSelfDescribe: data.personal.genderSelfDescribe || null,
        maritalStatus: data.personal.maritalStatus,
        bloodGroup: data.personal.bloodGroup,
        nationality: data.personal.nationality,
        currentAddress: data.personal.currentAddress,
        permanentAddress: data.personal.permanentAddress,
        sameAsCurrent: data.personal.sameAsCurrent,
        emergencyContactName: data.personal.emergencyContactName,
        emergencyContactPhone: data.personal.emergencyContactPhone,
        emergencyRelationship: data.personal.emergencyRelationship,
      },
      update: {
        dateOfBirth: new Date(data.personal.dateOfBirth),
        gender: data.personal.gender,
        genderSelfDescribe: data.personal.genderSelfDescribe || null,
        maritalStatus: data.personal.maritalStatus,
        bloodGroup: data.personal.bloodGroup,
        nationality: data.personal.nationality,
        currentAddress: data.personal.currentAddress,
        permanentAddress: data.personal.permanentAddress,
        sameAsCurrent: data.personal.sameAsCurrent,
        emergencyContactName: data.personal.emergencyContactName,
        emergencyContactPhone: data.personal.emergencyContactPhone,
        emergencyRelationship: data.personal.emergencyRelationship,
      },
    });

    await tx.identificationDetails.upsert({
      where: { employeeId },
      create: {
        employeeId,
        aadhaarNumber: encryptIfPresent(data.identification.aadhaarNumber),
        panNumber: encryptIfPresent(data.identification.panNumber.toUpperCase()),
        uan: data.identification.uan || null,
        esic: data.identification.esic || null,
      },
      update: {
        aadhaarNumber: encryptIfPresent(data.identification.aadhaarNumber),
        panNumber: encryptIfPresent(data.identification.panNumber.toUpperCase()),
        uan: data.identification.uan || null,
        esic: data.identification.esic || null,
      },
    });

    await tx.bankDetails.upsert({
      where: { employeeId },
      create: {
        employeeId,
        bankName: data.identification.bankName,
        accountHolderName: data.identification.accountHolderName,
        accountNumber: encryptIfPresent(data.identification.accountNumber),
        ifscCode: data.identification.ifscCode.toUpperCase(),
        branch: data.identification.branch,
      },
      update: {
        bankName: data.identification.bankName,
        accountHolderName: data.identification.accountHolderName,
        accountNumber: encryptIfPresent(data.identification.accountNumber),
        ifscCode: data.identification.ifscCode.toUpperCase(),
        branch: data.identification.branch,
      },
    });

    await tx.education.deleteMany({ where: { employeeId } });
    if (data.education.entries.length) {
      await tx.education.createMany({
        data: data.education.entries.map((e, i) => ({
          employeeId,
          qualification: e.qualification,
          institution: e.institution,
          year: e.year,
          percentage: e.percentage,
          sortOrder: i,
        })),
      });
    }

    await tx.employmentHistory.deleteMany({ where: { employeeId } });
    if (!data.employment.isFresher && data.employment.entries.length) {
      await tx.employmentHistory.createMany({
        data: data.employment.entries.map((e, i) => ({
          employeeId,
          company: e.company,
          designation: e.designation,
          fromDate: e.fromDate,
          toDate: e.toDate,
          lastDrawnCtc: e.lastDrawnCtc || null,
          reasonForLeaving: e.reasonForLeaving || null,
          sortOrder: i,
        })),
      });
    }

    await tx.professionalSummary.upsert({
      where: { employeeId },
      create: {
        employeeId,
        keySkills: data.professional.keySkills,
        totalYearsExperience: data.professional.totalYearsExperience,
        relevantIndustryExperience: data.professional.relevantIndustryExperience || null,
        majorAchievements: data.professional.majorAchievements || null,
      },
      update: {
        keySkills: data.professional.keySkills,
        totalYearsExperience: data.professional.totalYearsExperience,
        relevantIndustryExperience: data.professional.relevantIndustryExperience || null,
        majorAchievements: data.professional.majorAchievements || null,
      },
    });

    await tx.iTRequest.upsert({
      where: { employeeId },
      create: {
        employeeId,
        laptopRequired: data.it.laptopRequired,
        officialEmailNeeded: data.it.officialEmailNeeded,
        simCardRequired: data.it.simCardRequired,
        accessRequired: data.it.accessRequired,
        accessOther: data.it.accessOther || null,
      },
      update: {
        laptopRequired: data.it.laptopRequired,
        officialEmailNeeded: data.it.officialEmailNeeded,
        simCardRequired: data.it.simCardRequired,
        accessRequired: data.it.accessRequired,
        accessOther: data.it.accessOther || null,
      },
    });

    await tx.documentUpload.deleteMany({ where: { employeeId } });
    if (data.documents.uploads.length) {
      await tx.documentUpload.createMany({
        data: data.documents.uploads.map((d) => ({
          employeeId,
          documentType: d.documentType,
          fileName: d.fileName,
          fileUrl: d.fileUrl,
          fileKey: d.fileKey,
          mimeType: d.mimeType || null,
        })),
      });
    }

    await tx.acknowledgement.upsert({
      where: { employeeId },
      create: {
        employeeId,
        understoodPolicies: data.acknowledgements.understoodPolicies,
        maintainConfidentiality: data.acknowledgements.maintainConfidentiality,
        agreeCompanyRules: data.acknowledgements.agreeCompanyRules,
        understandAttendancePolicy: data.acknowledgements.understandAttendancePolicy,
        receivedSafetyInfo: data.acknowledgements.receivedSafetyInfo,
        agreeCodeOfConduct: data.acknowledgements.agreeCodeOfConduct,
        acknowledgeNda: data.acknowledgements.acknowledgeNda,
        agreeAssetHandling: data.acknowledgements.agreeAssetHandling,
        declarationSignature: data.acknowledgements.declarationSignature,
        declarationDate: now,
        ndaSignature: data.acknowledgements.ndaSignature,
        ndaDate: now,
        codeOfConductSignature: data.acknowledgements.codeOfConductSignature,
        codeOfConductDate: now,
      },
      update: {
        understoodPolicies: data.acknowledgements.understoodPolicies,
        maintainConfidentiality: data.acknowledgements.maintainConfidentiality,
        agreeCompanyRules: data.acknowledgements.agreeCompanyRules,
        understandAttendancePolicy: data.acknowledgements.understandAttendancePolicy,
        receivedSafetyInfo: data.acknowledgements.receivedSafetyInfo,
        agreeCodeOfConduct: data.acknowledgements.agreeCodeOfConduct,
        acknowledgeNda: data.acknowledgements.acknowledgeNda,
        agreeAssetHandling: data.acknowledgements.agreeAssetHandling,
        declarationSignature: data.acknowledgements.declarationSignature,
        declarationDate: now,
        ndaSignature: data.acknowledgements.ndaSignature,
        ndaDate: now,
        codeOfConductSignature: data.acknowledgements.codeOfConductSignature,
        codeOfConductDate: now,
      },
    });
  });
}

export async function reopenForEdits(employeeId: string) {
  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "IN_PROGRESS" as EmployeeStatus },
  });
}

export async function getEmployeeWithDetails(id: string) {
  return prisma.employee.findUnique({
    where: { id },
    include: {
      tokens: { where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 1 },
      personalDetails: true,
      identificationDetails: true,
      bankDetails: true,
      education: { orderBy: { sortOrder: "asc" } },
      employmentHistory: { orderBy: { sortOrder: "asc" } },
      professionalSummary: true,
      itRequest: true,
      documentUploads: true,
      acknowledgement: true,
      inductionChecklist: true,
      itAssetAllocations: { orderBy: { sortOrder: "asc" } },
    },
  });
}
