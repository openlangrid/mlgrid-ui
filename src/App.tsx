import React, { useEffect } from 'react';
//import './App.css';
import { Alert, Box, Tab, Tabs } from '@mui/material';
import { WSServiceInvoker } from './mlgrid/serviceInvoker';
import { Translation } from './components/Translation';
import { TextGuidedImageGeneration, TextGuidedImageGenerationInvocation } from './components/TextGuidedImageGeneration';
import { TestArray1 } from './components/TestArray1';
import { TestHolder } from './components/TestHolder';
import { Holder } from './util/Holder';
import { TestArray2 } from './components/TestArray2';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

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

function App() {
  const [value, setValue] = React.useState(0);
  const [services, setServices] = React.useState<Map<string, string[]>>(new Map<string, string[]>());
  const [tgigResults, setTgigResults] = React.useState(new Holder<TextGuidedImageGenerationInvocation[]>([]));

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const si = new WSServiceInvoker("wss://fungo.kcg.edu/mlgrid-services/ws");
  const refFirstRef = React.useRef(true);
  useEffect(()=>{
    if (process.env.NODE_ENV === "development" && refFirstRef.current) {
      refFirstRef.current = false;
      return;
    }
    console.log("search");
    si.serviceManagement().searchServices(0, 100, [], [])
      .then(r => {
        const s = new Map<string, string[]>();
        console.log(r);
        for(const e of r.entries){
          const st = e.serviceType;
          if(!s.has(st)) s.set(st, []);
          s.get(st)!.push(e.serviceId);
        }
        setServices(s);
      }).catch(e =>{
        console.log(e);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Alert severity="warning">
          アップロードされたデータはオープンソースソフトウェアで処理されたり，
          Google翻訳を含む外部サービスに送信されるとともに，研究目的で使用されます。 
          データそのものが直接外部に公開されることはありませんが，
          個人情報や秘密情報をアップロードしないようご注意ください。
        </Alert>
      </header>
      <main>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="Translation" />
            <Tab label="TextGuidedImageGeneration" />
            <Tab label="SpeechRecognition" />
            <Tab label="TestArray1" />
            <Tab label="TestArray2" />
            <Tab label="TestHolder" />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <Translation services={services} si={si} />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TextGuidedImageGeneration results={tgigResults} setResults={setTgigResults} services={services} si={si} />
        </TabPanel>
        <TabPanel value={value} index={2}>
          SpeechRecognition
        </TabPanel>
        <TabPanel value={value} index={3}>
          <TestArray1 />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <TestArray2 />
        </TabPanel>
        <TabPanel value={value} index={5}>
          <TestHolder />
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
