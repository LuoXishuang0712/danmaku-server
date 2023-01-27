create database `danmaku`;
use `danmaku`;

create table if not exists `user`(
    `user_id` int unsigned auto_increment not null,
    `user_name` varchar(100) not null unique collate utf8_bin,
    `password` varchar(100) not null collate utf8_bin,
    primary key (`user_id`)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table if not exists `login`(
    `login_id` int unsigned auto_increment not null,
    `user_id` int unsigned not null,
    `token` varchar(128) not null unique collate utf8_bin,
    `expiration` timestamp not null default current_timestamp,
    primary key (`login_id`),
    constraint `login_user_id` foreign key (`user_id`) references `user` (`user_id`) on delete cascade on update cascade
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

create table if not exists `anchor`(
    `anchor_id` int unsigned auto_increment not null,
    `user_id` int unsigned not null,
    `room_id` varchar(16) not null unique collate utf8_bin,
    primary key (`anchor_id`),
    constraint `anchor_user_id` foreign key (`user_id`) references `user` (`user_id`) on delete cascade on update cascade
)ENGINE=InnoDB DEFAULT CHARSET=utf8;