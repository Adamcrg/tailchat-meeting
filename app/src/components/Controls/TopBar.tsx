import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  lobbyPeersKeySelector,
  peersLengthSelector,
  raisedHandsSelector,
  makePermissionSelector,
  recordingInProgressSelector,
  recordingInProgressPeersSelector,
  recordingConsentsPeersSelector,
  useAppSelector,
  useAppDispatch,
} from '../../store/selectors';
import { permissions } from '../../permissions';
import * as appPropTypes from '../appPropTypes';
import { useRoomClient, withRoomContext } from '../../RoomContext';
import { withStyles } from '@material-ui/core/styles';
import * as roomActions from '../../store/actions/roomActions';
import * as toolareaActions from '../../store/actions/toolareaActions';
import * as notificationActions from '../../store/actions/notificationActions';
import { useIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Badge from '@material-ui/core/Badge';
import Paper from '@material-ui/core/Paper';
import AccountCircle from '@material-ui/icons/AccountCircle';
import FullScreenIcon from '@material-ui/icons/Fullscreen';
import FullScreenExitIcon from '@material-ui/icons/FullscreenExit';
import SettingsIcon from '@material-ui/icons/Settings';
import SecurityIcon from '@material-ui/icons/Security';
import PeopleIcon from '@material-ui/icons/People';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import VideoCallIcon from '@material-ui/icons/VideoCall';
import SelfViewOnIcon from '@material-ui/icons/Videocam';
import SelfViewOffIcon from '@material-ui/icons/VideocamOff';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import MoreIcon from '@material-ui/icons/MoreVert';
import HelpIcon from '@material-ui/icons/Help';
import InfoIcon from '@material-ui/icons/Info';
import ShareIcon from '@material-ui/icons/Share';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import PauseCircleFilledIcon from '@material-ui/icons/PauseCircleFilled';
import StopIcon from '@material-ui/icons/Stop';
import randomString from 'crypto-random-string';
import { recorder } from '../../features/BrowserRecorder';
import Logger from '../../features/Logger';
import { config } from '../../config';
import type { AppState } from '../../store/reducers/rootReducer';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import copy from 'copy-to-clipboard';
import * as requestActions from '../../store/actions/requestActions';

const logger = new Logger('Recorder');

const useStyles = makeStyles((theme) => ({
  persistentDrawerOpen: {
    width: 'calc(100% - 30vw)',
    marginLeft: '30vw',
    [theme.breakpoints.down('lg')]: {
      width: 'calc(100% - 30vw)',
      marginLeft: '40vw',
    },
    [theme.breakpoints.down('md')]: {
      width: 'calc(100% - 40vw)',
      marginLeft: '50vw',
    },
    [theme.breakpoints.down('sm')]: {
      width: 'calc(100% - 60vw)',
      marginLeft: '70vw',
    },
    [theme.breakpoints.down('xs')]: {
      width: 'calc(100% - 80vw)',
      marginLeft: '90vw',
    },
  },
  menuButton: {
    margin: 0,
    padding: 0,
  },
  logo: {
    display: 'none',
    marginLeft: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  divider: {
    marginLeft: theme.spacing(3),
  },
  show: {
    opacity: 1,
    transition: 'opacity .5s',
  },
  hide: {
    opacity: 0,
    transition: 'opacity .5s',
  },
  grow: {
    flexGrow: 1,
  },
  title: {
    display: 'none',
    marginLeft: 20,
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  sectionDesktop: {
    display: 'none',
    [theme.breakpoints.up('md')]: {
      display: 'flex',
    },
  },
  sectionMobile: {
    display: 'flex',
    [theme.breakpoints.up('md')]: {
      display: 'none',
    },
  },
  actionButton: {
    margin: theme.spacing(1, 0),
    padding: theme.spacing(0, 1),
  },
  disabledButton: {
    margin: theme.spacing(1, 0),
  },
  green: {
    color: 'rgba(0, 153, 0, 1)',
  },
  moreAction: {
    margin: theme.spacing(0.5, 0, 0.5, 1.5),
  },
  shareCard: {
    minWidth: 275,
  },
  shareCardActions: {
    padding: 16,
    justifyContent: 'end',
  },
}));

const PulsingBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: theme.palette.secondary.main,
    '&::after': {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: '$ripple 1.2s infinite ease-in-out',
      border: `3px solid ${theme.palette.secondary.main}`,
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}))(Badge);

const RecIcon = withStyles(() => ({
  root: {
    animation: '$pulse 2s infinite ease-in-out',
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(1.2)',
      opacity: 0,
    },
  },
}))(FiberManualRecordIcon);

const TopBar: React.FC = (props: any) => {
  const intl = useIntl();
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentMenu, setCurrentMenu] = useState<string | null>(null);
  const [recordingNotificationsId, setRecordingNotificationsId] =
    useState(null);

  const handleExited = () => {
    setCurrentMenu(null);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuOpen = (event: React.SyntheticEvent, menu: string) => {
    setAnchorEl(event.currentTarget);
    setCurrentMenu(menu);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);

    handleMobileMenuClose();
  };

  const {
    peersLength,
    lobbyPeers,
    permanentTopBar,
    drawerOverlayed,
    toolAreaOpen,
    isSafari,
    meId,
    isMobile,
    loggedIn,
    loginEnabled,
    fullscreenEnabled,
    fullscreen,
    onFullscreen,
    setSettingsOpen,
    setExtraVideoOpen,
    setHelpOpen,
    setAboutOpen,
    setLeaveOpen,
    setLockDialogOpen,
    setHideSelfView,
    toggleToolArea,
    openUsersTab,
    addNotification,
    closeNotification,
    unread,
    canProduceExtraVideo,
    canLock,
    canRecord,
    canPromote,
    locale,
    localesList,
    localRecordingState,
    recordingInProgress,
    recordingPeers,
    recordingMimeType,
    consumers,
    recordingConsents,
  } = props;
  const roomClient = useRoomClient();
  const room = useAppSelector((state) => state.room);
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const displayName = useAppSelector((state) => state.settings.displayName);

  const producers = useAppSelector((state) => state.producers);

  // did it change?
  recorder.checkMicProducer(producers);
  recorder.checkAudioConsumer(consumers, recordingConsents);

  useEffect(() => {
    // someone else is recording (need consent) or only me(dont need consent notif)
    const hasConsent =
      localRecordingState === undefined ||
      localRecordingState.consent !== 'init' ||
      (recordingPeers.includes(meId) && recordingPeers.length === 1);

    if (recordingInProgress && !recordingNotificationsId && !hasConsent) {
      const notificationId = randomString({ length: 6 }).toLowerCase();

      setRecordingNotificationsId(notificationId);
      addNotification({
        id: notificationId,
        type: 'warning',
        text: intl.formatMessage({
          id: 'room.recordingConsent',
          defaultMessage:
            'When attending this meeting you agree and give your consent that information (audio, video and metadata) about you can be part of that recording or broadcast',
        }),
        peerid: meId,
        roomClient: roomClient,
        persist: true,
      });
    }
    if (!recordingInProgress && recordingNotificationsId) {
      closeNotification(recordingNotificationsId);
      setRecordingNotificationsId(null);
    }
  }, [
    localRecordingState,
    recordingInProgress,
    recordingNotificationsId,
    addNotification,
    closeNotification,
    intl,
    meId,
    recordingPeers,
    roomClient,
    room,
  ]);

  const handleCopyJoinLink = () => {
    copy(
      [
        intl.formatMessage(
          {
            id: 'room.inviteText',
            defaultMessage: '{displayName} invite you join meeting',
          },
          {
            displayName,
          }
        ),
        `${intl.formatMessage({
          id: 'label.meetingNum',
          defaultMessage: 'Meeting Num',
        })}: ${roomClient.roomId}`,
        `${intl.formatMessage({
          id: 'label.joinLink',
          defaultMessage: 'Join Link',
        })}: ${window.location.origin}${window.location.pathname}`,
      ].join('\n')
    );

    dispatch(
      requestActions.notify({
        text: intl.formatMessage({
          id: 'room.hasCopied',
          defaultMessage: 'Has copied to clipboard',
        }),
      })
    );
    handleMenuClose();
  };

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const lockTooltip = room.locked
    ? intl.formatMessage({
        id: 'tooltip.unLockRoom',
        defaultMessage: 'Unlock room',
      })
    : intl.formatMessage({
        id: 'tooltip.lockRoom',
        defaultMessage: 'Lock room',
      });

  const recordingTooltip =
    localRecordingState.status === 'start' ||
    localRecordingState.status === 'resume'
      ? intl.formatMessage({
          id: 'tooltip.stopLocalRecording',
          defaultMessage: 'Stop local recording',
        })
      : intl.formatMessage({
          id: 'tooltip.startLocalRecording',
          defaultMessage: 'Start local recording',
        });

  const recordingPausedTooltip =
    localRecordingState.status === 'pause'
      ? intl.formatMessage({
          id: 'tooltip.resumeLocalRecording',
          defaultMessage: 'Resume paused local recording',
        })
      : intl.formatMessage({
          id: 'tooltip.pauseLocalRecording',
          defaultMessage: 'Pause local recording',
        });

  const fullscreenTooltip = fullscreen
    ? intl.formatMessage({
        id: 'tooltip.leaveFullscreen',
        defaultMessage: 'Leave fullscreen',
      })
    : intl.formatMessage({
        id: 'tooltip.enterFullscreen',
        defaultMessage: 'Enter fullscreen',
      });

  const loginTooltip = loggedIn
    ? intl.formatMessage({
        id: 'tooltip.logout',
        defaultMessage: 'Log out',
      })
    : intl.formatMessage({
        id: 'tooltip.login',
        defaultMessage: 'Log in',
      });

  return (
    <React.Fragment>
      <AppBar
        position="fixed"
        className={classnames(
          room.toolbarsVisible || permanentTopBar ? classes.show : classes.hide,
          !(isMobile || drawerOverlayed) && toolAreaOpen
            ? classes.persistentDrawerOpen
            : null
        )}
      >
        <Toolbar>
          {/* Left */}
          <PulsingBadge
            color="secondary"
            badgeContent={unread}
            onClick={() => toggleToolArea()}
          >
            <IconButton
              color="inherit"
              aria-label={intl.formatMessage({
                id: 'label.openDrawer',
                defaultMessage: 'Open drawer',
              })}
              className={classes.menuButton}
            >
              <MenuIcon />
            </IconButton>
          </PulsingBadge>
          {config.logo !== '' ? (
            <img alt="Logo" src={config.logo} className={classes.logo} />
          ) : (
            <Typography variant="h6" noWrap color="inherit">
              {config.title}
            </Typography>
          )}

          <div className={classes.grow} />

          {/* Right */}
          <div className={classes.sectionDesktop}>
            {recordingInProgress && (
              <IconButton
                disabled
                color="inherit"
                aria-label={intl.formatMessage({
                  id: 'label.recordingInProgress',
                  defaultMessage: 'Recording in Progress..',
                })}
                className={classes.menuButton}
              >
                <RecIcon color="secondary" />
              </IconButton>
            )}
            <div className={classes.divider} />
            {/* 更多 */}
            <Tooltip
              title={intl.formatMessage({
                id: 'label.moreActions',
                defaultMessage: 'More actions',
              })}
            >
              <IconButton
                aria-owns={
                  isMenuOpen && currentMenu === 'moreActions'
                    ? 'material-appbar'
                    : undefined
                }
                aria-haspopup
                onClick={(event) => handleMenuOpen(event, 'moreActions')}
                color="inherit"
              >
                <MoreIcon />
              </IconButton>
            </Tooltip>

            {/* 分享会议 */}
            <Tooltip
              title={intl.formatMessage({
                id: 'label.shareMeeting',
                defaultMessage: 'Share Meeting',
              })}
            >
              <IconButton
                aria-owns={
                  isMenuOpen && currentMenu === 'shareMeeting'
                    ? 'material-appbar'
                    : undefined
                }
                aria-haspopup
                onClick={(event) => handleMenuOpen(event, 'shareMeeting')}
                color="inherit"
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>

            {/* 全屏 */}
            {fullscreenEnabled && (
              <Tooltip title={fullscreenTooltip}>
                <IconButton
                  aria-label={intl.formatMessage({
                    id: 'tooltip.enterFullscreen',
                    defaultMessage: 'Enter fullscreen',
                  })}
                  className={classes.actionButton}
                  color="inherit"
                  onClick={onFullscreen}
                >
                  {fullscreen ? <FullScreenExitIcon /> : <FullScreenIcon />}
                </IconButton>
              </Tooltip>
            )}

            {/* 参会人 */}
            <Tooltip
              title={intl.formatMessage({
                id: 'tooltip.participants',
                defaultMessage: 'Show participants',
              })}
            >
              <IconButton
                aria-label={intl.formatMessage({
                  id: 'tooltip.participants',
                  defaultMessage: 'Show participants',
                })}
                color="inherit"
                onClick={() => openUsersTab()}
              >
                <Badge color="primary" badgeContent={peersLength + 1}>
                  <PeopleIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* 设置 */}
            <Tooltip
              title={intl.formatMessage({
                id: 'tooltip.settings',
                defaultMessage: 'Show settings',
              })}
            >
              <IconButton
                aria-label={intl.formatMessage({
                  id: 'tooltip.settings',
                  defaultMessage: 'Show settings',
                })}
                className={classes.actionButton}
                color="inherit"
                onClick={() => setSettingsOpen(!room.settingsOpen)}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            {/* 锁定房间 */}
            <Tooltip title={lockTooltip}>
              <span className={classes.disabledButton}>
                <IconButton
                  aria-label={intl.formatMessage({
                    id: 'tooltip.lockRoom',
                    defaultMessage: 'Lock room',
                  })}
                  className={classes.actionButton}
                  color="inherit"
                  disabled={!canLock}
                  onClick={() => {
                    if (room.locked) {
                      roomClient.unlockRoom();
                    } else {
                      roomClient.lockRoom();
                    }
                  }}
                >
                  {room.locked ? <LockIcon /> : <LockOpenIcon />}
                </IconButton>
              </span>
            </Tooltip>

            {/* 显示大厅 */}
            {lobbyPeers.length > 0 && (
              <Tooltip
                title={intl.formatMessage({
                  id: 'tooltip.lobby',
                  defaultMessage: 'Show lobby',
                })}
              >
                <span className={classes.disabledButton}>
                  <IconButton
                    aria-label={intl.formatMessage({
                      id: 'tooltip.lobby',
                      defaultMessage: 'Show lobby',
                    })}
                    className={classes.actionButton}
                    color="inherit"
                    disabled={!canPromote}
                    onClick={() => setLockDialogOpen(!room.lockDialogOpen)}
                  >
                    <PulsingBadge
                      color="secondary"
                      badgeContent={lobbyPeers.length}
                    >
                      <SecurityIcon />
                    </PulsingBadge>
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {loginEnabled && (
              <Tooltip title={loginTooltip}>
                <IconButton
                  aria-label={intl.formatMessage({
                    id: 'tooltip.login',
                    defaultMessage: 'Log in',
                  })}
                  className={classes.actionButton}
                  color="inherit"
                  onClick={() => {
                    loggedIn ? roomClient.logout() : roomClient.login();
                  }}
                >
                  <AccountCircle className={loggedIn ? classes.green : null} />
                </IconButton>
              </Tooltip>
            )}
          </div>
          <div className={classes.sectionMobile}>
            {lobbyPeers.length > 0 && (
              <Tooltip
                title={intl.formatMessage({
                  id: 'tooltip.lobby',
                  defaultMessage: 'Show lobby',
                })}
              >
                <span className={classes.disabledButton}>
                  <IconButton
                    aria-label={intl.formatMessage({
                      id: 'tooltip.lobby',
                      defaultMessage: 'Show lobby',
                    })}
                    className={classes.actionButton}
                    color="inherit"
                    disabled={!canPromote}
                    onClick={() => setLockDialogOpen(!room.lockDialogOpen)}
                  >
                    <PulsingBadge
                      color="secondary"
                      badgeContent={lobbyPeers.length}
                    >
                      <SecurityIcon />
                    </PulsingBadge>
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <IconButton
              aria-haspopup
              onClick={handleMobileMenuOpen}
              color="inherit"
            >
              <MoreIcon />
            </IconButton>
          </div>
          <div className={classes.divider} />

          <Button
            aria-label={locale.split(/[-_]/)[0]}
            className={classes.actionButton}
            color="secondary"
            disableRipple
            onClick={(event) => handleMenuOpen(event, 'localeMenu')}
          >
            {locale.split(/[-_]/)[0]}
          </Button>

          <Button
            aria-label={intl.formatMessage({
              id: 'label.leave',
              defaultMessage: 'Leave',
            })}
            className={classes.actionButton}
            variant="contained"
            color="secondary"
            onClick={() => setLeaveOpen(!room.leaveOpen)}
          >
            <FormattedMessage id="label.leave" defaultMessage="Leave" />
          </Button>
        </Toolbar>
      </AppBar>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onExited={handleExited}
        getContentAnchorEl={null}
      >
        {currentMenu === 'moreActions' && (
          <Paper>
            {(localRecordingState.status === 'start' ||
              localRecordingState.status === 'resume' ||
              localRecordingState.status === 'pause') && (
              <MenuItem
                aria-label={recordingPausedTooltip}
                onClick={() => {
                  handleMenuClose();
                  if (localRecordingState.status === 'pause') {
                    recorder.resumeLocalRecording();
                  } else {
                    recorder.pauseLocalRecording();
                  }
                }}
              >
                <Badge color="primary">
                  {localRecordingState.status === 'pause' ? (
                    <PauseCircleFilledIcon />
                  ) : (
                    <PauseCircleOutlineIcon />
                  )}
                </Badge>
                {localRecordingState.status === 'pause' ? (
                  <p className={classes.moreAction}>
                    <FormattedMessage
                      id="tooltip.resumeLocalRecording"
                      defaultMessage="Resume paused local recording"
                    />
                  </p>
                ) : (
                  <p className={classes.moreAction}>
                    <FormattedMessage
                      id="tooltip.pauseLocalRecording"
                      defaultMessage="Pause local recording"
                    />
                  </p>
                )}
              </MenuItem>
            )}
            {config.localRecordingEnabled && isSafari && canRecord && (
              <MenuItem
                aria-label={recordingTooltip}
                onClick={async () => {
                  handleMenuClose();
                  if (
                    localRecordingState.status === 'start' ||
                    localRecordingState.status === 'pause' ||
                    localRecordingState.status === 'resume'
                  ) {
                    recorder.stopLocalRecording();
                  } else {
                    try {
                      const additionalAudioTracks = [];
                      const micProducer = Object.values(producers).find(
                        (p: any) => p.source === 'mic'
                      );

                      if (micProducer)
                        additionalAudioTracks.push(micProducer.track);
                      const roomname = room.name;

                      recorder.startLocalRecording({
                        roomClient,
                        additionalAudioTracks,
                        recordingMimeType,
                        roomname,
                      });

                      recorder.checkAudioConsumer(consumers);
                    } catch (err) {
                      logger.error(
                        'Error during starting the recording! error:%O',
                        err.message
                      );
                    }
                  }
                }}
              >
                <Badge color="primary">
                  {localRecordingState.status === 'start' ||
                  localRecordingState.status === 'pause' ||
                  localRecordingState.status === 'resume' ? (
                    <StopIcon />
                  ) : (
                    <FiberManualRecordIcon />
                  )}
                </Badge>

                {localRecordingState.status === 'start' ||
                localRecordingState.status === 'pause' ||
                localRecordingState.status === 'resume' ? (
                  <p className={classes.moreAction}>
                    <FormattedMessage
                      id="tooltip.stopLocalRecording"
                      defaultMessage="Stop local recording"
                    />
                  </p>
                ) : (
                  <p className={classes.moreAction}>
                    <FormattedMessage
                      id="tooltip.startLocalRecording"
                      defaultMessage="Start local recording"
                    />
                  </p>
                )}
              </MenuItem>
            )}
            <MenuItem
              disabled={!canProduceExtraVideo}
              onClick={() => {
                handleMenuClose();
                setExtraVideoOpen(!room.extraVideoOpen);
              }}
            >
              <VideoCallIcon
                aria-label={intl.formatMessage({
                  id: 'label.addVideo',
                  defaultMessage: 'Add new video input',
                })}
              />
              <p className={classes.moreAction}>
                <FormattedMessage
                  id="label.addVideo"
                  defaultMessage="Add new video input"
                />
              </p>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setHideSelfView(!room.hideSelfView);
              }}
            >
              {room.hideSelfView ? (
                <SelfViewOnIcon
                  aria-label={intl.formatMessage({
                    id: 'room.showSelfView',
                    defaultMessage: 'Show self view video',
                  })}
                />
              ) : (
                <SelfViewOffIcon
                  aria-label={intl.formatMessage({
                    id: 'room.hideSelfView',
                    defaultMessage: 'Hide self view video',
                  })}
                />
              )}
              {room.hideSelfView ? (
                <p className={classes.moreAction}>
                  <FormattedMessage
                    id="room.showSelfView"
                    defaultMessage="Show self view video"
                  />
                </p>
              ) : (
                <p className={classes.moreAction}>
                  <FormattedMessage
                    id="room.hideSelfView"
                    defaultMessage="Hide self view video"
                  />
                </p>
              )}
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setHelpOpen(!room.helpOpen);
              }}
            >
              <HelpIcon
                aria-label={intl.formatMessage({
                  id: 'room.help',
                  defaultMessage: 'Help',
                })}
              />
              <p className={classes.moreAction}>
                <FormattedMessage id="room.help" defaultMessage="Help" />
              </p>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                setAboutOpen(!room.aboutOpen);
              }}
            >
              <InfoIcon
                aria-label={intl.formatMessage({
                  id: 'room.about',
                  defaultMessage: 'About',
                })}
              />
              <p className={classes.moreAction}>
                <FormattedMessage id="room.about" defaultMessage="About" />
              </p>
            </MenuItem>
          </Paper>
        )}

        {currentMenu === 'shareMeeting' && (
          <Card className={classes.shareCard}>
            <CardContent>
              <Table aria-label="meeting info">
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <FormattedMessage
                        id="label.meetingNum"
                        defaultMessage="Meeting Num"
                      />
                    </TableCell>
                    <TableCell>{roomClient.roomId}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>
                      <FormattedMessage
                        id="label.joinLink"
                        defaultMessage="Join Link"
                      />
                    </TableCell>
                    <TableCell>
                      {window.location.origin}
                      {window.location.pathname}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardActions className={classes.shareCardActions}>
              <Button size="small" onClick={handleCopyJoinLink}>
                <FormattedMessage
                  id="label.copyLink"
                  defaultMessage="Copy Link"
                />
              </Button>
            </CardActions>
          </Card>
        )}

        {currentMenu === 'localeMenu' && (
          <Paper>
            {localesList.map((item, index) => (
              <MenuItem
                selected={item.locale.includes(locale)}
                key={index}
                onClick={() => {
                  roomClient.setLocale(item.locale[0]);
                  handleMenuClose();
                }}
              >
                {item.name}
              </MenuItem>
            ))}
          </Paper>
        )}
      </Popover>
      <Menu
        anchorEl={mobileMoreAnchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={isMobileMenuOpen}
        onClose={handleMenuClose}
        getContentAnchorEl={null}
      >
        {loginEnabled && (
          <MenuItem
            aria-label={loginTooltip}
            onClick={() => {
              handleMenuClose();
              loggedIn ? roomClient.logout() : roomClient.login();
            }}
          >
            <AccountCircle className={loggedIn ? classes.green : null} />
            {loggedIn ? (
              <p className={classes.moreAction}>
                <FormattedMessage
                  id="tooltip.logout"
                  defaultMessage="Log out"
                />
              </p>
            ) : (
              <p className={classes.moreAction}>
                <FormattedMessage id="tooltip.login" defaultMessage="Log in" />
              </p>
            )}
          </MenuItem>
        )}
        {(localRecordingState.status === 'pause' ||
          localRecordingState.status === 'resume' ||
          localRecordingState.status === 'start') && (
          <MenuItem
            aria-label={recordingPausedTooltip}
            onClick={() => {
              handleMenuClose();
              if (localRecordingState.status === 'pause') {
                recorder.resumeLocalRecording();
              } else {
                recorder.pauseLocalRecording();
              }
            }}
          >
            <Badge color="primary">
              {localRecordingState.status === 'pause' ? (
                <PauseCircleFilledIcon />
              ) : (
                <PauseCircleOutlineIcon />
              )}
            </Badge>

            {localRecordingState.status === 'pause' ? (
              <p className={classes.moreAction}>
                <FormattedMessage
                  id="tooltip.resumeLocalRecording"
                  defaultMessage="Resume paused local recording"
                />
              </p>
            ) : (
              <p className={classes.moreAction}>
                <FormattedMessage
                  id="tooltip.pauseLocalRecording"
                  defaultMessage="Pause local recording"
                />
              </p>
            )}
          </MenuItem>
        )}
        <MenuItem
          aria-label={lockTooltip}
          disabled={!canLock}
          onClick={() => {
            handleMenuClose();

            if (room.locked) {
              roomClient.unlockRoom();
            } else {
              roomClient.lockRoom();
            }
          }}
        >
          {room.locked ? <LockIcon /> : <LockOpenIcon />}
          {room.locked ? (
            <p className={classes.moreAction}>
              <FormattedMessage
                id="tooltip.unLockRoom"
                defaultMessage="Unlock room"
              />
            </p>
          ) : (
            <p className={classes.moreAction}>
              <FormattedMessage
                id="tooltip.lockRoom"
                defaultMessage="Lock room"
              />
            </p>
          )}
        </MenuItem>
        <MenuItem
          aria-label={intl.formatMessage({
            id: 'tooltip.settings',
            defaultMessage: 'Show settings',
          })}
          onClick={() => {
            handleMenuClose();
            setSettingsOpen(!room.settingsOpen);
          }}
        >
          <SettingsIcon />
          <p className={classes.moreAction}>
            <FormattedMessage
              id="tooltip.settings"
              defaultMessage="Show settings"
            />
          </p>
        </MenuItem>
        <MenuItem
          aria-label={intl.formatMessage({
            id: 'tooltip.participants',
            defaultMessage: 'Show participants',
          })}
          onClick={() => {
            handleMenuClose();
            openUsersTab();
          }}
        >
          <Badge color="primary" badgeContent={peersLength + 1}>
            <PeopleIcon />
          </Badge>
          <p className={classes.moreAction}>
            <FormattedMessage
              id="tooltip.participants"
              defaultMessage="Show participants"
            />
          </p>
        </MenuItem>
        {fullscreenEnabled && (
          <MenuItem
            aria-label={intl.formatMessage({
              id: 'tooltip.enterFullscreen',
              defaultMessage: 'Enter fullscreen',
            })}
            onClick={() => {
              handleMenuClose();
              onFullscreen();
            }}
          >
            {fullscreen ? <FullScreenExitIcon /> : <FullScreenIcon />}
            <p className={classes.moreAction}>
              <FormattedMessage
                id="tooltip.enterFullscreen"
                defaultMessage="Enter fullscreen"
              />
            </p>
          </MenuItem>
        )}
        <MenuItem
          disabled={!canProduceExtraVideo}
          onClick={() => {
            handleMenuClose();
            setExtraVideoOpen(!room.extraVideoOpen);
          }}
        >
          <VideoCallIcon
            aria-label={intl.formatMessage({
              id: 'label.addVideo',
              defaultMessage: 'Add new video input',
            })}
          />
          <p className={classes.moreAction}>
            <FormattedMessage
              id="label.addVideo"
              defaultMessage="Add new video input"
            />
          </p>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setHideSelfView(!room.hideSelfView);
          }}
        >
          {room.hideSelfView ? (
            <SelfViewOnIcon
              aria-label={intl.formatMessage({
                id: 'room.showSelfView',
                defaultMessage: 'Show self view video',
              })}
            />
          ) : (
            <SelfViewOffIcon
              aria-label={intl.formatMessage({
                id: 'room.hideSelfView',
                defaultMessage: 'Hide self view video',
              })}
            />
          )}
          {room.hideSelfView ? (
            <p className={classes.moreAction}>
              <FormattedMessage
                id="room.showSelfView"
                defaultMessage="Show self view video"
              />
            </p>
          ) : (
            <p className={classes.moreAction}>
              <FormattedMessage
                id="room.hideSelfView"
                defaultMessage="Hide self view video"
              />
            </p>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setHelpOpen(!room.helpOpen);
          }}
        >
          <HelpIcon
            aria-label={intl.formatMessage({
              id: 'room.help',
              defaultMessage: 'Help',
            })}
          />
          <p className={classes.moreAction}>
            <FormattedMessage id="room.help" defaultMessage="Help" />
          </p>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setAboutOpen(!room.aboutOpen);
          }}
        >
          <InfoIcon
            aria-label={intl.formatMessage({
              id: 'room.about',
              defaultMessage: 'About',
            })}
          />
          <p className={classes.moreAction}>
            <FormattedMessage id="room.about" defaultMessage="About" />
          </p>
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
};

TopBar.propTypes = {
  roomClient: PropTypes.object.isRequired,
  room: appPropTypes.Room.isRequired,
  isSafari: PropTypes.bool,
  meId: PropTypes.string,
  isMobile: PropTypes.bool.isRequired,
  peersLength: PropTypes.number,
  lobbyPeers: PropTypes.array,
  permanentTopBar: PropTypes.bool.isRequired,
  drawerOverlayed: PropTypes.bool.isRequired,
  toolAreaOpen: PropTypes.bool.isRequired,
  loggedIn: PropTypes.bool.isRequired,
  loginEnabled: PropTypes.bool.isRequired,
  fullscreenEnabled: PropTypes.bool,
  fullscreen: PropTypes.bool,
  onFullscreen: PropTypes.func.isRequired,
  setToolbarsVisible: PropTypes.func.isRequired,
  setSettingsOpen: PropTypes.func.isRequired,
  setLeaveOpen: PropTypes.func.isRequired,
  setExtraVideoOpen: PropTypes.func.isRequired,
  setHelpOpen: PropTypes.func.isRequired,
  setAboutOpen: PropTypes.func.isRequired,
  setLockDialogOpen: PropTypes.func.isRequired,
  setHideSelfView: PropTypes.func.isRequired,
  toggleToolArea: PropTypes.func.isRequired,
  openUsersTab: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  closeNotification: PropTypes.func.isRequired,
  unread: PropTypes.number.isRequired,
  canProduceExtraVideo: PropTypes.bool.isRequired,
  canLock: PropTypes.bool.isRequired,
  canRecord: PropTypes.bool.isRequired,
  canPromote: PropTypes.bool.isRequired,
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  intl: PropTypes.object,
  locale: PropTypes.string.isRequired,
  localesList: PropTypes.array.isRequired,
  localRecordingState: PropTypes.string,
  recordingInProgress: PropTypes.bool,
  recordingPeers: PropTypes.array,
  recordingMimeType: PropTypes.string,
  producers: PropTypes.object,
  consumers: PropTypes.object,
  recordingConsents: PropTypes.array,
};

const makeMapStateToProps = () => {
  const hasExtraVideoPermission = makePermissionSelector(
    permissions.EXTRA_VIDEO
  );

  const hasLockPermission = makePermissionSelector(
    permissions.CHANGE_ROOM_LOCK
  );

  const hasRecordPermission = makePermissionSelector(
    permissions.LOCAL_RECORD_ROOM
  );
  const hasPromotionPermission = makePermissionSelector(
    permissions.PROMOTE_PEER
  );

  const mapStateToProps = (state: AppState) => ({
    room: state.room,
    isSafari: state.me.browser.name !== 'safari',
    meId: state.me.id,
    isMobile: state.me.browser.platform === 'mobile',
    peersLength: peersLengthSelector(state),
    lobbyPeers: lobbyPeersKeySelector(state),
    permanentTopBar: state.settings.permanentTopBar,
    drawerOverlayed: state.settings.drawerOverlayed,
    toolAreaOpen: state.toolarea.toolAreaOpen,
    loggedIn: state.me.loggedIn,
    loginEnabled: state.me.loginEnabled,
    localRecordingState: state.recorder.localRecordingState,
    recordingInProgress: recordingInProgressSelector(state),
    recordingPeers: recordingInProgressPeersSelector(state),
    recordingConsents: recordingConsentsPeersSelector(state),
    unread:
      state.toolarea.unreadMessages +
      state.toolarea.unreadFiles +
      raisedHandsSelector(state),
    canProduceExtraVideo: hasExtraVideoPermission(state),
    canLock: hasLockPermission(state),
    canRecord: hasRecordPermission(state),
    canPromote: hasPromotionPermission(state),
    locale: state.intl.locale,
    localesList: state.intl.list,
    recordingMimeType: state.settings.recorderPreferredMimeType,
    producers: state.producers,
    consumers: state.consumers,
  });

  return mapStateToProps;
};

const mapDispatchToProps = (dispatch) => ({
  setToolbarsVisible: (visible) => {
    dispatch(roomActions.setToolbarsVisible(visible));
  },
  setSettingsOpen: (settingsOpen) => {
    dispatch(roomActions.setSettingsOpen(settingsOpen));
  },
  setExtraVideoOpen: (extraVideoOpen) => {
    dispatch(roomActions.setExtraVideoOpen(extraVideoOpen));
  },
  setHelpOpen: (helpOpen) => {
    dispatch(roomActions.setHelpOpen(helpOpen));
  },
  setAboutOpen: (aboutOpen) => {
    dispatch(roomActions.setAboutOpen(aboutOpen));
  },
  setLeaveOpen: (leaveOpen) => {
    dispatch(roomActions.setLeaveOpen(leaveOpen));
  },
  setLockDialogOpen: (lockDialogOpen) => {
    dispatch(roomActions.setLockDialogOpen(lockDialogOpen));
  },
  setHideSelfView: (hideSelfView) => {
    dispatch(roomActions.setHideSelfView(hideSelfView));
  },
  toggleToolArea: () => {
    dispatch(toolareaActions.toggleToolArea());
  },
  openUsersTab: () => {
    dispatch(toolareaActions.openToolArea());
    dispatch(toolareaActions.setToolTab('users'));
  },
  addNotification: (notification) => {
    dispatch(notificationActions.addNotification(notification));
  },
  closeNotification: (notificationId) => {
    dispatch(notificationActions.closeNotification(notificationId));
  },
});

export default withRoomContext(
  connect(makeMapStateToProps, mapDispatchToProps, null, {
    areStatesEqual: (next, prev) => {
      return (
        prev.room === next.room &&
        prev.peers === next.peers &&
        prev.lobbyPeers === next.lobbyPeers &&
        prev.settings.permanentTopBar === next.settings.permanentTopBar &&
        prev.settings.drawerOverlayed === next.settings.drawerOverlayed &&
        prev.me.loggedIn === next.me.loggedIn &&
        prev.me.browser === next.me.browser &&
        prev.me.loginEnabled === next.me.loginEnabled &&
        prev.me.picture === next.me.picture &&
        prev.me.roles === next.me.roles &&
        prev.recorder.localRecordingState.status ===
          next.recorder.localRecordingState.status &&
        prev.toolarea.unreadMessages === next.toolarea.unreadMessages &&
        prev.toolarea.unreadFiles === next.toolarea.unreadFiles &&
        prev.toolarea.toolAreaOpen === next.toolarea.toolAreaOpen &&
        prev.intl.locale === next.intl.locale &&
        prev.intl.localesList === next.intl.localesList &&
        prev.producers === next.producers &&
        prev.consumers === next.consumers &&
        prev.settings.recorderPreferredMimeType ===
          next.settings.recorderPreferredMimeType &&
        recordingConsentsPeersSelector(prev) ===
          recordingConsentsPeersSelector(next)
      );
    },
  })(TopBar)
);
