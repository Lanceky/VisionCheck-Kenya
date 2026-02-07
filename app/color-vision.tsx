import { useRouter } from 'expo-router';
import ColorVisionTest from '../components/VisionTests/ColorVisionTest';

export default function ColorVisionScreen() {
  const router = useRouter();

  const handleComplete = (results: any) => {
    console.log('Color Vision Test results:', JSON.stringify(results, null, 2));
  };

  const handleExit = () => {
    router.back();
  };

  return (
    <ColorVisionTest
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
