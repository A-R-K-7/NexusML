import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8 min-h-screen animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
