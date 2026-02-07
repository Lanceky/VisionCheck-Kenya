import { useRouter } from 'expo-router';
import AstigmatismTest from '../components/VisionTests/AstigmatismTest';

export default function AstigmatismScreen() {
  const router = useRouter();

  const handleComplete = (results: any) => {
    console.log('Astigmatism Test results:', JSON.stringify(results, null, 2));
  };

  const handleExit = () => {
    router.back();
  };

  return (
    <AstigmatismTest
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
