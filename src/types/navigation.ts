export type RootStackParamList = {
  Home: undefined;
  Recordings: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
