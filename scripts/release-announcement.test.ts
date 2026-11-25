import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import UpdateAnnouncementModal from '../src/td/UpdateAnnouncementModal';
import { CURRENT_RELEASE } from '../shared/releaseNotes';

test('announcement places its fixed release date below the title and before its notes', () => {
  assert.equal(CURRENT_RELEASE.releaseDate, '2026-11-25');
  const html = renderToStaticMarkup(createElement(UpdateAnnouncementModal, {
    confirming: false, error: null, onConfirm: () => {},
  }));
  assert.match(html, /更新时间：<time dateTime="2026-11-25">2026年11月25日<\/time>/);
  assert.ok(html.indexOf('</h2>') < html.indexOf('update-announcement-date'));
  assert.ok(html.indexOf('update-announcement-date') < html.indexOf('update-announcement-list'));
  for (const note of CURRENT_RELEASE.notes) assert.ok(html.includes(note));
});
