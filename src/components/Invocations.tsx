import { Invocation as HPEInvocation } from './HumanPoseEstimation';
import { Invocation as ICLInvocation } from './ImageClassification';
import { Invocation as ICOInvocation } from './ImageConversion';
import { Invocation as ITTCInvocation } from './ImageToTextConversion';
import { Invocation as ODInvocation } from './ObjectDetection';
import { Invocation as OSInvocation } from './ObjectSegmentation';
import { Invocation as SRInvocation} from './SpeechRecognition';
import { Invocation as SERInvocation } from './SpeechEmotionRecognition';
import { Invocation as CSRInvocation } from './ContinuousSpeechRecognition';
import { Invocation as TGIGInvocation } from './TextGuidedImageGeneration';
import { Invocation as TGIMInvocation } from './TextGuidedImageManipulation';
import { Invocation as TSAInvocation } from './TextSentimentAnalysis';
import { Invocation as TTSInvocation } from './TextToSpeech';
import { Invocation as TRInvocation } from './Translation';

export class Invocations {
    csr: CSRInvocation[] = [];
    hpe: HPEInvocation[] = [];
    icl: ICLInvocation[] = [];
    ico: ICOInvocation[] = [];
    ittc: ITTCInvocation[] = [];
    od: ODInvocation[] = [];
    os: OSInvocation[] = [];
    ser: SERInvocation[] = [];
    sr: SRInvocation[] = [];
    tgig: TGIGInvocation[] = [];
    tgim: TGIMInvocation[] = [];
    tsa: TSAInvocation[] = [];
    tr: TRInvocation[] = [];
    tts: TTSInvocation[] = [];
}
