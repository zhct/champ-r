import s from './app.module.scss';

import React, { useReducer, useState, useMemo, useEffect } from 'react';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { Button } from 'baseui/button';
import { Checkbox } from 'baseui/checkbox';
import { StatefulTooltip as Tooltip } from 'baseui/tooltip';
import { Tag, VARIANT } from 'baseui/tag';

import appReducer, {
  initialState,
  init,
  setLolVersion,
  updateItemMap
} from 'src/share/reducer';
import AppContext from 'src/share/context';

import Sources from 'src/share/sources';

import { getLolVer, getItemList } from 'src/service/ddragon';
import fetchOpgg from 'src/service/data-source/op-gg';
import fetchLolqq from 'src/service/data-source/lol-qq';

import ChampionTable from 'src/components/champion-table';
import WaitingList from 'src/components/waiting-list';
import Toolbar from 'src/components/toolbar';

const { dialog } = require('electron').remote;
const config = require('./native/config');

const engine = new Styletron();

const App = () => {
  const [store, dispatch] = useReducer(appReducer, initialState, init);
  const [version, setVersion] = useState(config.get(`lolVer`));
  const [lolDir, setLolDir] = useState(config.get(`lolDir`));
  const [selectedSources, toggleSource] = useState([
    Sources.Opgg,
    Sources.Lolqq
  ]);

  const onSelectDir = async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (canceled) return;

    const dir = filePaths[0];
    setLolDir(dir);
    config.set('lolDir', dir);
  };

  const clearFolder = () => {
    setLolDir(``);
    config.set('lolDir', ``);
  };

  const importFromSources = () => {
    const { itemMap } = store;
    if (selectedSources.includes(Sources.Opgg)) {
      // eslint-disable-next-line
      fetchOpgg(version, lolDir, dispatch, itemMap).then(result => {
        console.log(`op.gg: ${result}`);
      });
    }
    if (selectedSources.includes(Sources.Lolqq)) {
      // eslint-disable-next-line
      fetchLolqq(lolDir, itemMap).then(result => {
        console.log(`lol.qq.com: ${result}`);
      });
    }
  };

  const onCheck = val => ev => {
    const { checked } = ev.target;
    if (checked) {
      toggleSource(selectedSources.concat(val));
    } else {
      const idx = selectedSources.indexOf(val);
      toggleSource([
        ...selectedSources.slice(0, idx),
        ...selectedSources.slice(idx + 1)
      ]);
    }
  };

  useEffect(() => {
    const getVernItems = async () => {
      const v = await getLolVer();
      await setVersion(v);
      dispatch(setLolVersion(v));
      config.set(`lolVer`, v);

      const language = config.get(`language`);
      const data = await getItemList(v, language);
      dispatch(updateItemMap(data));
    };

    getVernItems();
  }, []);

  const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

  const isFetching = store.fetching.length > 0;
  const shouldDisableImport =
    !version || !lolDir || !selectedSources.length || !store.itemMap;

  return (
    <AppContext.Provider value={contextValue}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <Toolbar />
          <div className={s.container}>
            <h2>Champ Remix</h2>

            <div className={s.info}>
              LOL folder is
              <Tag
                closeable={!!lolDir}
                kind="accent"
                variant={VARIANT.light}
                onClick={onSelectDir}
                onActionClick={clearFolder}
              >
                <Tooltip content={lolDir && `Click to re-select.`}>
                  {lolDir || `Click here to select`}
                </Tooltip>
              </Tag>
            </div>
            <div className={s.info}>
              LOL version is{' '}
              <Tag closeable={false} kind="accent">
                {version}
              </Tag>
            </div>

            {Object.values(Sources).map(v => (
              <Checkbox
                key={v}
                checked={selectedSources.includes(v)}
                onChange={onCheck(v)}
              >
                {v}
              </Checkbox>
            ))}

            <Button
              className={s.import}
              disabled={shouldDisableImport}
              isLoading={isFetching}
              onClick={importFromSources}
            >
              import
            </Button>

            <div className={s.champions}>
              <WaitingList />
              <ChampionTable />
            </div>
          </div>
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  );
};

export default App;
