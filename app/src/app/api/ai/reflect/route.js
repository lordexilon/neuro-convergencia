import {handleAiRequest} from '../../../../lib/ai-request.cjs';
export async function POST(request) {
  return handleAiRequest(request);
}
