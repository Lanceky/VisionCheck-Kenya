import { useRouter } from 'expo-router';
import VisualAcuityTest from '../components/VisionTests/VisualAcuityTest';

export default function VisualAcuityScreen() {
  const router = useRouter();

  const handleComplete = (results: any) => {
    console.log('Visual Acuity Test results:', JSON.stringify(results, null, 2));
  };

  const handleExit = () => {
    router.back();
  };

  return (
    <VisualAcuityTest
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
