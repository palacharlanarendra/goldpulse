import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// For Expo Go, we might need 'main'
AppRegistry.registerComponent('main', () => App);
AppRegistry.registerComponent(appName, () => App);

export default App;
