import React, { useEffect } from 'react';
//import './App.css';
import { Alert, Box, Tab, Tabs } from '@mui/material';
import { WSServiceInvoker } from './mlgrid/serviceInvoker';
import { ServiceCheck } from './components/lib/Services';
import { Invocations } from './components/Invocations';

import { BrowserSR } from './components/BrowserSR';
import { Chat } from './components/Chat';
import { ChatWithTextToSpeech } from './components/ChatWithTextToSpeech';
import { ContinuousSpeechRecognition } from './components/ContinuousSpeechRecognition';
import { HumanPoseEstimation } from './components/HumanPoseEstimation';
import { ImageClassification } from './components/ImageClassification';
import { ImageConversion } from './components/ImageConversion';
import { ImageToTextConversion } from './components/ImageToTextConversion';
import { ObjectDetection } from './components/ObjectDetection';
import { ObjectSegmentation } from './components/ObjectSegmentation';
import { SpeechRecognition } from './components/SpeechRecognition';
import { SpeechEmotionRecognition } from './components/SpeechEmotionRecognition';
import { Test } from './components/Test';
import { TextGuidedImageGeneration } from './components/TextGuidedImageGeneration';
import { TextGuidedImageManipulation } from './components/TextGuidedImageManipulation';
import { TextSentimentAnalysis } from './components/TextSentimentAnalysis';
import { TextToSpeech } from './components/TextToSpeech';
import { Translation } from './components/Translation';

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

const invocations: Invocations = new Invocations();
function App() {
  const [value, setValue] = React.useState(0);
  const [services, setServices] = React.useState(new Map<string, ServiceCheck[]>());
  const firstGroupNum = 9;
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };
  const handleChange2 = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue + firstGroupNum);
  };

  const si = new WSServiceInvoker("wss://fungo.kcg.edu/mlgrid-services/ws");
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
          s.get(st)!.push({serviceId: e.serviceId, checked: true});
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
              variant="scrollable" scrollButtons="auto">
            <Tab label="翻訳" />
            <Tab label="チャット" />
            <Tab label="チャット音声合成" />
            <Tab label="テキスト感情分析" />
            <Tab label="画像生成" />
            <Tab label="テキスト画像編集" />
            <Tab label="画像変換" />
            <Tab label="画像テキスト化" />
            <Tab label="テスト" />
          </Tabs>
          <Tabs value={value - firstGroupNum} onChange={handleChange2} aria-label="サービス種別"
              variant="scrollable" scrollButtons="auto">
            <Tab label="画像分類" />
            <Tab label="物体検出" />
            <Tab label="セグメンテーション" />
            <Tab label="姿勢推定" />
            <Tab label="音声認識" />
            <Tab label="リアルタイム音声認識" />
            <Tab label="ブラウザ音声認識" />
            <Tab label="音声感情認識" />
            <Tab label="音声合成" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={index++}>
          <Translation services={services} si={si} invocations={invocations.tr} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <Chat services={services} si={si} invocations={invocations.c} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ChatWithTextToSpeech services={services} si={si} invocations={invocations.cwtts} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextSentimentAnalysis services={services} si={si} invocations={invocations.tsa} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedImageGeneration services={services} si={si} invocations={invocations.tgig} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedImageManipulation services={services} si={si} invocations={invocations.tgim} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ImageConversion services={services} si={si} invocations={invocations.ico} />
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
      </main>
      <footer>
        <hr/>
        Copyright kcg.edu Future Lab.
      </footer>
    </div>
  );
}

export default App;
