export interface PilotFlightHours {
  total: number;
  picTurbine: number;
  night: number;
  instrument: number;
}

export interface PilotCredential {
  id: string;
  name: string;
  role: string;
  portraitUrl: string;
  faaCert: string;
  medicalClass: string;
  medicalStatus: string;
  passId: string;
  typeRatings: string[];
  clearanceLevel: string;
  homeBaseIcao: string;
  hours: PilotFlightHours;
  certificateGrade: string;
  commercialPrivileges: string;
  isActive: boolean;
}

export const DEFAULT_PILOT_SPECIMEN: PilotCredential = {
  id: 'pilot_jc_2822744',
  name: 'JEFF COURSEY',
  role: 'ATP CAPTAIN // G650ER • GLOBAL 7500',
  portraitUrl: '/pilot-portrait.jpg',
  faaCert: '2822744',
  medicalClass: 'CLASS 1',
  medicalStatus: 'Class 1 — Valid (No Waivers)',
  passId: 'B-90001',
  typeRatings: ['G-VII (G650/G700)', 'BD-700 (Global)', 'CE-750 (Citation X)'],
  clearanceLevel: 'LEVEL 4 ACTIVE',
  homeBaseIcao: 'KTEB (TETERBORO)',
  hours: {
    total: 11420,
    picTurbine: 8850,
    night: 1150,
    instrument: 2100,
  },
  certificateGrade: 'ATP Multi-Engine Land',
  commercialPrivileges: 'Single Engine Land',
  isActive: true,
};
