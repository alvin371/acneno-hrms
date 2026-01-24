declare module '@react-native-documents/picker' {
  export interface DocumentPickerResponse {
    uri: string;
    fileCopyUri?: string | null;
    type: string | null;
    name: string | null;
    size: number | null;
  }

  export interface PickOptions {
    type?: string | string[];
    copyTo?: 'cachesDirectory' | 'documentDirectory';
    allowMultiSelection?: boolean;
  }

  export const types: {
    allFiles: string;
    audio: string;
    csv: string;
    doc: string;
    docx: string;
    images: string;
    pdf: string;
    plainText: string;
    ppt: string;
    pptx: string;
    video: string;
    xls: string;
    xlsx: string;
    zip: string;
  };

  export function pick(options?: PickOptions): Promise<DocumentPickerResponse[]>;
  export function pickSingle(options?: PickOptions): Promise<DocumentPickerResponse>;
  export function pickMultiple(options?: PickOptions): Promise<DocumentPickerResponse[]>;
  export function isCancel(error: unknown): boolean;
  export function isInProgress(error: unknown): boolean;

  const DocumentPicker: {
    types: typeof types;
    pick: typeof pick;
    pickSingle: typeof pickSingle;
    pickMultiple: typeof pickMultiple;
    isCancel: typeof isCancel;
    isInProgress: typeof isInProgress;
  };

  export default DocumentPicker;
}
