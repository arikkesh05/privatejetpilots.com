import { PilotCredential } from '../types/credential';

export function generateAppleWalletPass(pilot: PilotCredential): string {
  const serialNumber = `RAMP-${pilot.id}`;
  const barcodeMessage = `${pilot.id}|${pilot.faaCert}|${pilot.passId}`;

  const pass = {
    passTypeIdentifier: 'pass.com.privatejetpilots.ramp',
    serialNumber,
    formatVersion: 1,
    teamIdentifier: 'PJP',
    organizationName: 'Private Jet Pilots',
    description: 'Executive Ramp Pass',
    foregroundColor: '#ffffff',
    backgroundColor: '#0a0d11',
    labelColor: '#cbb079',
    logoText: 'PJP',
    voided: false,
    barcode: {
      message: barcodeMessage,
      format: 'PKBarcodeFormatQR',
      messageEncoding: 'iso-8859-1',
      altText: pilot.passId,
    },
    storeCard: {
      headerFields: [
        {
          key: 'pilot-name',
          label: 'PILOT',
          value: pilot.name,
        },
        {
          key: 'pilot-role',
          label: 'ROLE',
          value: pilot.role,
        },
      ],
      primaryFields: [
        {
          key: 'faa-cert',
          label: 'FAA CERT',
          value: pilot.faaCert,
        },
        {
          key: 'medical-class',
          label: 'MEDICAL',
          value: pilot.medicalClass,
        },
      ],
      secondaryFields: [
        {
          key: 'home-base',
          label: 'HOME BASE',
          value: pilot.homeBaseIcao,
        },
        {
          key: 'clearance-level',
          label: 'CLEARANCE',
          value: pilot.clearanceLevel,
        },
      ],
    },
  };

  return JSON.stringify(pass, null, 2);
}

export function exportPassFile(pilot: PilotCredential): void {
  const passJson = generateAppleWalletPass(pilot);
  const fileName = `${pilot.name.replace(/\s+/g, '_')}_Ramp_Pass.json`;

  const blob = new Blob([passJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
