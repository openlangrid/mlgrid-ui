import React, { useEffect } from 'react';
//import './App.css';
import { Alert, Box, Tab, Tabs } from '@mui/material';
import { WSServiceInvoker } from './mlgrid/serviceInvoker';
import { ServiceCheck } from './components/lib/Services';

import { HumanPoseEstimation, Invocation as HumanPoseEstimationInvocation } from './components/HumanPoseEstimation';
import { ImageClassification, Invocation as ImageClassificationInvocation } from './components/ImageClassification';
import { ObjectDetection, Invocation as ObjectDetectionInvocation } from './components/ObjectDetection';
import { ObjectSegmentation, Invocation as ObjectSegmentationInvocation } from './components/ObjectSegmentation';
import { SpeechRecognition, Invocation as SpeechRecognitionInvocation} from './components/SpeechRecognition';
import { TextGuidedImageGeneration, Invocation as TextGuidedImageGenerationInvocation } from './components/TextGuidedImageGeneration';
import { TextGuidedImageManipulation, Invocation as TextGuidedImageManipulationInvocation } from './components/TextGuidedImageManipulation';
import { Translation, Invocation as TranslationInvocation } from './components/Translation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
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

const hpeInvocations: HumanPoseEstimationInvocation[] = [];
const icInvocations: ImageClassificationInvocation[] = [];
const odInvocations: ObjectDetectionInvocation[] = [];
const osInvocations: ObjectSegmentationInvocation[] = [];
const tgigInvocations: TextGuidedImageGenerationInvocation[] = [];
const tgimInvocations: TextGuidedImageManipulationInvocation[] = [];
const transInvocations: TranslationInvocation[] = [];
const srInvocations: SpeechRecognitionInvocation[] = [];
function App() {
  const [value, setValue] = React.useState(0);
  const [services, setServices] = React.useState(new Map<string, ServiceCheck[]>());
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
            <Tab label="画像生成" />
            <Tab label="テキスト画像編集" />
            <Tab label="画像分類" />
            <Tab label="物体検出" />
            <Tab label="セグメンテーション" />
            <Tab label="姿勢推定" />
            <Tab label="音声認識" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={index++}>
          <Translation services={services} si={si} invocations={transInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedImageGeneration services={services} si={si} invocations={tgigInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <TextGuidedImageManipulation services={services} si={si} invocations={tgimInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ImageClassification services={services} si={si} invocations={icInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ObjectDetection services={services} si={si} invocations={odInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <ObjectSegmentation services={services} si={si} invocations={osInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <HumanPoseEstimation services={services} si={si} invocations={hpeInvocations} />
        </TabPanel>
        <TabPanel value={value} index={index++}>
          <SpeechRecognition services={services} si={si} invocations={srInvocations} />
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
