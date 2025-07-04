import React, { useEffect } from 'react';
import './App.css';
import { Alert, Box, Tab, Tabs } from '@mui/material';
import { WSServiceInvoker } from './mlgrid/ServiceInvoker';
import { ServiceCheck } from './components/lib/Services';
import { Invocations } from './Invocations';

import { BrowserSR } from './components/BrowserSR';
import { Chat } from './components/Chat';
import { ContextualQuestionAnswering } from './components/ContexturalQuetionAnswering';
import { ContinuousSpeechRecognition } from './components/ContinuousSpeechRecognition';
import { HumanPoseEstimation } from './components/HumanPoseEstimation';
import { ImageClassification } from './components/ImageClassification';
import { ImageConversion } from './components/ImageConversion';
import { ImageToTextConversion } from './components/ImageToTextConversion';
import { MorphologicalAnalysis } from './components/MorphologicalAnalysis';
import { ObjectDetection } from './components/ObjectDetection';
import { ObjectSegmentation } from './components/ObjectSegmentation';
import { SpeechRecognition } from './components/SpeechRecognition';
import { SpeechEmotionRecognition } from './components/SpeechEmotionRecognition';
import { Test } from './components/Test';
import { TextGenerationWithTextToSpeech } from './components/TextGenerationWithTextToSpeech';
import { TextGenerationWithTranslation } from './components/experiments/Composite';
import { TextGuidedImageGeneration } from './components/TextGuidedImageGeneration';
import { TextGuidedImageManipulation } from './components/TextGuidedImageManipulation';
import { TextGeneration } from './components/TextGeneration';
import { TextInstruction } from './components/TextInstruction';
import { TextInstructionWithImage } from './components/TextInstructionWithImage';
import { TextSentimentAnalysis } from './components/TextSentimentAnalysis';
import { TextSimilarityCalculation } from './components/TextSimilarityCalculation';
import { TextToSpeech } from './components/TextToSpeech';
import { Translation } from './components/Translation';
import { VisualQuestionAnswering } from './components/VisualQuestionAnswering';
import { TextGuidedVideoGeneration } from './components/TextGuidedVideoGeneration';
import { VirtualTryOn } from './components/VirtualTryOn';

interface Props {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel({ children, value, index, ...other }: Props) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Window{
  mlgrid_url: string
}
declare var window: Window

class AppState{
  invocations: Invocations = new Invocations();
  serviceInvoker: WSServiceInvoker;
  constructor(){
    this.serviceInvoker = new WSServiceInvoker(window.mlgrid_url);
  }
  static get(){
    if(AppState.instance == null) AppState.instance = new AppState();
    return AppState.instance;
  }
  private static instance: AppState | null = null;
}

function App() {
  const [value, setValue] = React.useState(0);
  const [services, setServices] = React.useState(new Map<string, ServiceCheck[]>());
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  
  const appState = AppState.get();
  const si = appState.serviceInvoker;
  const invocations = appState.invocations;

  const refFirst = React.useRef(true);
  useEffect(()=>{
    if (process.env.NODE_ENV === "development" && refFirst.current) {
      refFirst.current = false;
      return;
    }
    si.serviceManagement().searchServices(0, 100, [], [])
      .then(r => {
        const s = new Map<string, ServiceCheck[]>();
        for(const e of r.entries){
          const st = e.serviceType;
          if(!s.has(st)) s.set(st, []);
          s.get(st)!.push({
            serviceId: e.serviceId, checked: false,
            description: e.description, license: e.license,
            url: e.url
          });
        }
        setServices(s);
      }).catch(e =>{
        console.log(e);
      });
  }, []);

  let index = 0;
  return (
    <div className="App">
      <header className="App-header">
        <Alert severity="error">
          アップロードされたデータはオープンソースソフトウェアで処理されたり，
          Google翻訳を含む外部サービスに送信されるとともに，研究目的で使用されます。 
          データそのものが直接外部に公開されることはありませんが，
          個人情報や秘密情報をアップロードしないようご注意ください。
        </Alert>
      </header>
      <main>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="サービス種別"
              variant="scrollable" scrollButtons="auto"
              TabIndicatorProps={{ sx: { display: 'none' } }}
              sx={{
                '& .MuiTabs-flexContainer': {
                  flexWrap: 'wrap',
                },
              }}>
            <Tab label="複合サービス" />
            <Tab label="翻訳" />
            <Tab label="テキスト生成" />
            <Tab label="テキスト指示" />
            <Tab label="VLM" />
            <Tab label="テキストQA" />
            <Tab label="チャット" />
            <Tab label="画像QA" />
            <Tab label="テキスト生成+音声合成" />
            <Tab label="テキスト感情分析" />
            <Tab label="画像生成" />
            <Tab label="動画生成" />
            <Tab label="テキスト画像編集" />
            <Tab label="テキスト類似度計算" />
            <Tab label="画像変換" />
            <Tab label="仮想試着" />
            <Tab label="画像テキスト化" />
            <Tab label="テスト" />
            <Tab label="画像分類" />
            <Tab label="物体検出" />
            <Tab label="セグメンテーション" />
            <Tab label="姿勢推定" />
            <Tab label="音声認識" />
            <Tab label="リアルタイム音声認識" />
            <Tab label="ブラウザ音声認識" />
            <Tab label="音声感情認識" />
            <Tab label="音声合成" />
            <Tab label="形態素解析" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={index++}>
          <TextGenerationWithTranslation services={services} si={si} invocations={invocations.tgwt} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <Translation services={services} si={si} invocations={invocations.tr} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGeneration services={services} si={si} invocations={invocations.tg} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextInstruction services={services} si={si} invocations={invocations.ti} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextInstructionWithImage services={services} si={si} invocations={invocations.twi} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ContextualQuestionAnswering services={services} si={si} invocations={invocations.cqa} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <Chat services={services} si={si} invocations={invocations.c} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <VisualQuestionAnswering services={services} si={si} invocations={invocations.iwi} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGenerationWithTextToSpeech services={services} si={si} invocations={invocations.cwtts} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextSentimentAnalysis services={services} si={si} invocations={invocations.tsa} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedImageGeneration services={services} si={si} invocations={invocations.tgig} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedVideoGeneration services={services} si={si} invocations={invocations.tgvg} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedImageManipulation services={services} si={si} invocations={invocations.tgim} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextSimilarityCalculation services={services} si={si} invocations={invocations.tsc} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ImageConversion services={services} si={si} invocations={invocations.ico} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <VirtualTryOn services={services} si={si} invocations={invocations.vton} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ImageToTextConversion services={services} si={si} invocations={invocations.ittc} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <Test services={services} si={si} invocations={invocations.test} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ImageClassification services={services} si={si} invocations={invocations.icl} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ObjectDetection services={services} si={si} invocations={invocations.od} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ObjectSegmentation services={services} si={si} invocations={invocations.os} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <HumanPoseEstimation services={services} si={si} invocations={invocations.hpe} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <SpeechRecognition services={services} si={si} invocations={invocations.sr} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ContinuousSpeechRecognition services={services} si={si} invocations={invocations.csr} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <BrowserSR services={services} si={si} invocations={invocations.bsr} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <SpeechEmotionRecognition services={services} si={si} invocations={invocations.ser} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextToSpeech services={services} si={si} invocations={invocations.tts} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <MorphologicalAnalysis services={services} si={si} invocations={invocations.ma} />
        </TabPanel>
      </main>
      <footer>
        <hr/>
        Copyright kcg.edu Future Lab.
      </footer>
    </div>
  );
}

export default App;
