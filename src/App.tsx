import { AppRouter } from './router';

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 selection:bg-blue-500 selection:text-white">
      <AppRouter />
    </div>
  );
}

export default App;
