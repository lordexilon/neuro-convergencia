import {handleApplication} from '../../../../lib/pilot-application.cjs';

export async function POST(request) {
  return handleApplication(request);
}
