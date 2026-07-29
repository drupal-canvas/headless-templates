const Header = ({ logo, menu }) => (
  <header className="relative grid w-full grid-cols-2 justify-center gap-4 border-b border-solid border-gray-200 bg-white px-8 py-3 leading-[normal]">
    <div className="my-1 max-h-8 min-w-[100px] justify-self-start md:my-3">
      {logo}
    </div>
    <div className="flex w-full min-w-[200px] items-center justify-end gap-2 justify-self-end md:min-w-[300px] md:content-center md:justify-center md:justify-self-center md:px-6 md:py-2">
      <div className="md:w-full">{menu}</div>
    </div>
  </header>
);

export default Header;
