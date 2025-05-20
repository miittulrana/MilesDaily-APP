import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  index: undefined;
  login: undefined;
  '(auth)': NavigatorScreenParams<AuthTabParamList>;
};

export type AuthTabParamList = {
  tracking: undefined;
  settings: undefined;
};